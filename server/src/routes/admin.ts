import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { adminMiddleware } from '../middleware/auth'
import type { JwtPayload } from '../middleware/auth'

const admin = new Hono()

// 所有管理端路由都需要admin认证
admin.use('/*', adminMiddleware)

// 仪表盘统计
admin.get('/stats', async (c) => {
  try {
    const [goodsOnSale, goodsSold, users, groupbuys] = await Promise.all([
      getCollection('goods').where({ status: 'on_sale' }).count(),
      getCollection('goods').where({ status: 'sold' }).count(),
      getCollection('users').count(),
      getCollection('groupbuys').where({ status: 'pending' }).count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: {
        goodsOnSale: goodsOnSale.total || 0,
        goodsSold: goodsSold.total || 0,
        totalUsers: users.total || 0,
        activeGroupbuys: groupbuys.total || 0,
      },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// ===== 商品管理 =====

admin.get('/goods', async (c) => {
  try {
    const { page = '1', pageSize = '20', status, keyword } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    let query: any = {}
    if (status) query.status = status
    if (keyword) query.title = new RegExp(keyword, 'i')

    const [listRes, countRes] = await Promise.all([
      getCollection('goods').where(query).orderBy('createdAt', 'desc').skip(skip).limit(ps).get(),
      getCollection('goods').where(query).count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: { list: listRes.data || [], total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 强制修改商品状态
admin.put('/goods/:id/status', async (c) => {
  try {
    const { id } = c.req.param()
    const { status } = await c.req.json()

    if (!['on_sale', 'sold', 'offline', 'deleted'].includes(status)) {
      return c.json({ code: 400, message: '无效状态' }, 400)
    }

    await getCollection('goods').doc(id).update({ status, updatedAt: new Date() })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// ===== 用户管理 =====

admin.get('/users', async (c) => {
  try {
    const { page = '1', pageSize = '20', keyword } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    let query: any = {}
    if (keyword) query.nickname = new RegExp(keyword, 'i')

    const [listRes, countRes] = await Promise.all([
      getCollection('users').where(query).orderBy('createdAt', 'desc').skip(skip).limit(ps).get(),
      getCollection('users').where(query).count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: { list: listRes.data || [], total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 设置用户角色
admin.put('/users/:id/role', async (c) => {
  try {
    const { id } = c.req.param()
    const { role } = await c.req.json()

    if (!['user', 'admin'].includes(role)) {
      return c.json({ code: 400, message: '无效角色' }, 400)
    }

    await getCollection('users').doc(id).update({ role, updatedAt: new Date() })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 禁用/启用用户
admin.put('/users/:id/status', async (c) => {
  try {
    const { id } = c.req.param()
    const { status } = await c.req.json()

    if (!['active', 'disabled'].includes(status)) {
      return c.json({ code: 400, message: '无效状态' }, 400)
    }

    await getCollection('users').doc(id).update({ status, updatedAt: new Date() })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// ===== 公告管理 =====

admin.post('/announcements', async (c) => {
  try {
    const body = await c.req.json()
    const user = c.get('user') as JwtPayload

    if (!body.title || !body.content) {
      return c.json({ code: 400, message: '标题和内容不能为空' }, 400)
    }

    await getCollection('announcements').add({
      title: body.title,
      content: body.content,
      type: body.type || 'notice',
      author: body.author || '管理员',
      pinned: body.pinned || false,
      readCount: 0,
      createdAt: new Date(),
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// ===== 推荐地址管理 =====

admin.get('/locations', async (c) => {
  try {
    const res = await getCollection('locations').orderBy('orderBy', 'asc').limit(100).get()
    return c.json({ code: 0, message: 'success', data: res.data || [] })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

admin.post('/locations', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name) return c.json({ code: 400, message: '地址名称不能为空' }, 400)

    await getCollection('locations').add({
      name: body.name,
      community: body.community || '',
      orderBy: body.orderBy || 99,
      createdAt: new Date(),
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

admin.delete('/locations/:id', async (c) => {
  try {
    await getCollection('locations').doc(c.req.param('id')).remove()
    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// ===== 操作日志 =====

admin.get('/logs', async (c) => {
  try {
    const { page = '1', pageSize = '20', type } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    let query: any = {}
    if (type) query.type = type

    const [listRes, countRes] = await Promise.all([
      getCollection('admin_logs').where(query).orderBy('createdAt', 'desc').skip(skip).limit(ps).get(),
      getCollection('admin_logs').where(query).count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: { list: listRes.data || [], total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default admin
