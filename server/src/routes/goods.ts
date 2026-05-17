import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'
import { writeLog } from '../utils/logger'
import type { JwtPayload } from '../middleware/auth'

const goods = new Hono()

// 获取商品列表（公开）
goods.get('/', async (c) => {
  try {
    const { page = '1', pageSize = '20', category, keyword, condition, community } = c.req.query()
    const p = Number(page)
    const ps = Math.min(Number(pageSize), 50)
    const skip = (p - 1) * ps

    // 构建查询条件：在售 + 已卖出都可见，排除下架和已删除
    let query: any = { status: { $in: ['on_sale', 'sold'] } }

    if (category && category !== '全部') {
      query.category = category
    }
    if (condition) {
      query.condition = condition
    }
    if (keyword) {
      query.title = new RegExp(keyword, 'i')
    }
    if (community) {
      query.community = community
    }

    const [listRes, countRes] = await Promise.all([
      getCollection('goods')
        .where(query)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(ps)
        .get(),
      getCollection('goods')
        .where(query)
        .count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: {
        list: listRes.data || [],
        total: countRes.total || 0,
        page: p,
        pageSize: ps,
      },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// CloudBase .doc().get() 返回类数组对象，统一提取
function extractDoc(data: any): any {
  if (Array.isArray(data)) return data[0]
  if (data && typeof data === 'object' && data[0] !== undefined) return data[0]
  return data
}

// 获取商品详情（公开）
goods.get('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const res = await getCollection('goods').doc(id).get()
    const good = extractDoc(res.data)

    if (!good || !good._id) {
      return c.json({ code: 404, message: '商品不存在' }, 404)
    }

    // 已删除的商品不可见（除非是发布者）
    if (good.status === 'deleted') {
      return c.json({ code: 404, message: '商品不存在' }, 404)
    }

    // 增加浏览量
    await getCollection('goods').doc(id).update({
      viewCount: (good.viewCount || 0) + 1,
    })

    // 手机号脱敏（非发布者）
    const user = c.get('user') as JwtPayload | undefined
    if (!user || user.openid !== good.publisherId) {
      if (good.contactPhone) {
        good.contactPhone = good.contactPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
    }

    return c.json({ code: 0, message: 'success', data: good })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 发布商品（需登录）
goods.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const body = await c.req.json()

    // 校验
    if (!body.title || body.title.trim().length === 0) {
      return c.json({ code: 400, message: '请输入商品名称' }, 400)
    }
    if (body.title.length > 30) {
      return c.json({ code: 400, message: '名称不能超过30字' }, 400)
    }
    if (!body.price || Number(body.price) <= 0) {
      return c.json({ code: 400, message: '请输入有效售价' }, 400)
    }
    if (!body.condition) {
      return c.json({ code: 400, message: '请选择成色' }, 400)
    }
    if (!body.contactWechat && !body.contactPhone) {
      return c.json({ code: 400, message: '请至少填写一种联系方式' }, 400)
    }

    // 手机号格式校验
    if (body.contactPhone && !/^1[3-9]\d{9}$/.test(body.contactPhone)) {
      return c.json({ code: 400, message: '手机号格式不正确' }, 400)
    }

    // 微信号格式校验
    if (body.contactWechat && !/^[a-zA-Z][a-zA-Z0-9_]{5,19}$/.test(body.contactWechat)) {
      return c.json({ code: 400, message: '微信号格式不正确' }, 400)
    }

    // 获取用户信息
    const userRes = await getCollection('users').where({ openid: user.openid }).limit(1).get()
    const userInfo: any = userRes.data?.[0] || {}

    const good = {
      publisherId: user.openid,
      publisherInfo: {
        nickname: userInfo.nickname || '微信用户',
        avatar: userInfo.avatar || '',
        community: userInfo.community || '',
        building: userInfo.building || '',
      },
      community: userInfo.community || '',
      title: body.title.trim(),
      description: (body.description || '').slice(0, 300),
      images: body.images || [],
      category: body.category || '其他',
      condition: body.condition,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      location: body.location || '',
      contactWechat: body.contactWechat || '',
      contactPhone: body.contactPhone || '',
      status: 'on_sale',
      soldAt: null,
      viewCount: 0,
      favCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const addRes = await getCollection('goods').add(good)

    await writeLog(c, {
      operatorId: user.openid,
      operatorName: userInfo.nickname || '微信用户',
      type: 'create',
      content: `发布「${good.title}」¥${good.price}`,
      targetId: addRes.id,
    })

    return c.json({
      code: 0,
      message: 'success',
      data: { _id: addRes.id },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 标记已卖出
goods.put('/:id/sell', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { id } = c.req.param()

    const res = await getCollection('goods').doc(id).get()
    const good = extractDoc(res.data)

    if (!good || !good._id) {
      return c.json({ code: 404, message: '商品不存在' }, 404)
    }
    if (good.publisherId !== user.openid) {
      return c.json({ code: 403, message: '只能操作自己的商品' }, 403)
    }
    if (good.status === 'sold') {
      return c.json({ code: 400, message: '商品已标记为已卖出' }, 400)
    }

    await getCollection('goods').doc(id).update({
      status: 'sold',
      soldAt: new Date(),
      updatedAt: new Date(),
    })

    await writeLog(c, {
      operatorId: user.openid,
      operatorName: good.publisherInfo?.nickname || '',
      type: 'sell',
      content: `「${good.title}」标记为已卖出`,
      targetId: id,
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 下架/上架商品
goods.put('/:id/shelf', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { id } = c.req.param()
    const { status } = await c.req.json()

    if (!['on_sale', 'off_shelf'].includes(status)) {
      return c.json({ code: 400, message: '无效状态' }, 400)
    }

    const res = await getCollection('goods').doc(id).get()
    const good = extractDoc(res.data)
    if (!good || !good._id) return c.json({ code: 404, message: '商品不存在' }, 404)
    if (good.publisherId !== user.openid) return c.json({ code: 403, message: '只能操作自己的商品' }, 403)

    await getCollection('goods').doc(id).update({
      status,
      updatedAt: new Date(),
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 更新商品信息（仅下架状态可编辑）
goods.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { id } = c.req.param()
    const body = await c.req.json()

    const res = await getCollection('goods').doc(id).get()
    const good = extractDoc(res.data)
    if (!good || !good._id) return c.json({ code: 404, message: '商品不存在' }, 404)
    if (good.publisherId !== user.openid) return c.json({ code: 403, message: '只能修改自己的商品' }, 403)

    // 可更新字段
    const allowedFields = ['title', 'description', 'price', 'originalPrice', 'condition', 'category', 'location', 'contactWechat', 'contactPhone', 'images', 'status']
    const updateData: any = { updatedAt: new Date() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    await getCollection('goods').doc(id).update(updateData)

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 删除商品（软删除）
goods.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { id } = c.req.param()

    const res = await getCollection('goods').doc(id).get()
    const good = extractDoc(res.data)

    if (!good || !good._id) {
      return c.json({ code: 404, message: '商品不存在' }, 404)
    }
    if (good.publisherId !== user.openid) {
      return c.json({ code: 403, message: '只能删除自己的商品' }, 403)
    }

    await getCollection('goods').doc(id).update({
      status: 'deleted',
      updatedAt: new Date(),
    })

    await writeLog(c, {
      operatorId: user.openid,
      operatorName: good.publisherInfo?.nickname || '',
      type: 'delete',
      content: `删除「${good.title}」`,
      targetId: id,
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default goods
