import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { generateToken, verifyWxLogin, authMiddleware } from '../middleware/auth'
import { writeLog } from '../utils/logger'
import type { JwtPayload } from '../middleware/auth'

const auth = new Hono()

// 微信小程序登录
auth.post('/login', async (c) => {
  try {
    const { code } = await c.req.json()
    
    if (!code) {
      return c.json({ code: 400, message: '缺少code参数' }, 400)
    }

    // 获取openid
    const openid = await verifyWxLogin(code)

    // 查找或创建用户
    const userRes = await getCollection('users').where({ openid }).limit(1).get()
    let user: any

    if (userRes.data && userRes.data.length > 0) {
      user = userRes.data[0]
    } else {
      // 新用户注册
      const newUser = {
        openid,
        nickname: '微信用户',
        avatar: '',
        phone: '',
        wechat: '',
        community: '',
        building: '',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const addRes = await getCollection('users').add(newUser)
      user = { _id: addRes.id, ...newUser }
    }

    // 检查用户是否被禁用
    if (user.status === 'disabled') {
      return c.json({ code: 403, message: '账号已被禁用' }, 403)
    }

    // 生成token
    const token = generateToken({
      openid: user.openid,
      role: user.role || 'user',
    })

    await writeLog(c, {
      operatorId: user.openid,
      operatorName: user.nickname,
      type: 'login',
      content: '微信授权登录',
    })

    return c.json({
      code: 0,
      message: 'success',
      data: {
        token,
        userInfo: {
          _id: user._id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          community: user.community,
          building: user.building,
          role: user.role,
        },
      },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 管理员账号密码登录
auth.post('/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ code: 400, message: '请输入账号密码' }, 400)
    }

    // 查找管理员
    const res = await getCollection('admin_accounts')
      .where({ username, status: 'active' })
      .limit(1)
      .get()

    if (!res.data || res.data.length === 0) {
      return c.json({ code: 401, message: '账号或密码错误' }, 401)
    }

    const admin: any = res.data[0]

    // 验证密码（bcrypt比较）
    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return c.json({ code: 401, message: '账号或密码错误' }, 401)
    }

    const token = generateToken({
      openid: admin._id,
      role: 'admin',
    })

    await writeLog(c, {
      operatorId: admin._id,
      operatorName: admin.username,
      type: 'login',
      content: '管理员登录',
    })

    return c.json({
      code: 0,
      message: 'success',
      data: { token, username: admin.username },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 获取当前用户信息
auth.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user') as JwtPayload
  
  const res = await getCollection('users')
    .where({ openid: user.openid })
    .limit(1)
    .get()

  if (!res.data || res.data.length === 0) {
    return c.json({ code: 404, message: '用户不存在' }, 404)
  }

  const userInfo = res.data[0]
  delete (userInfo as any).openid // 不返回openid

  return c.json({ code: 0, message: 'success', data: userInfo })
})

// 获取我发布的商品列表
auth.get('/my-goods', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { page = '1', pageSize = '20', status = 'all' } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    const query: any = { publisherId: user.openid }
    if (status !== 'all') {
      query.status = status
    }

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

// 获取我的统计数据
auth.get('/my-stats', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload

    const [publishedRes, favoritesRes, groupbuyRes] = await Promise.all([
      getCollection('goods').where({ publisherId: user.openid }).count(),
      getCollection('favorites').where({ userId: user.openid }).count(),
      // 查询我参与的拼团（participants 包含我的 openid）或我发起的
      getCollection('groupbuys').where({
        participants: user.openid,
      }).count(),
    ])

    return c.json({
      code: 0,
      message: 'success',
      data: {
        published: publishedRes.total || 0,
        favorites: favoritesRes.total || 0,
        groupbuy: groupbuyRes.total || 0,
      },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 更新用户信息
auth.put('/profile', authMiddleware, async (c) => {
  const user = c.get('user') as JwtPayload
  const body = await c.req.json()

  const allowedFields = ['nickname', 'avatar', 'phone', 'wechat', 'community', 'building']
  const updateData: any = { updatedAt: new Date() }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  await getCollection('users').where({ openid: user.openid }).update(updateData)

  return c.json({ code: 0, message: 'success' })
})

export default auth
