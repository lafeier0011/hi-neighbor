import { Hono } from 'hono'
import { getCollection, getDb } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'

const groupbuy = new Hono()

// 拼团列表（公开）
groupbuy.get('/', async (c) => {
  try {
    const { page = '1', pageSize = '20', status } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    let query: any = {}
    if (status) query.status = status

    const [listRes, countRes] = await Promise.all([
      getCollection('groupbuys').where(query).orderBy('createdAt', 'desc').skip(skip).limit(ps).get(),
      getCollection('groupbuys').where(query).count(),
    ])

    // 实时修正过期状态
    const now = new Date()
    const list = (listRes.data || []).map((item: any) => {
      if (item.status === 'pending' && item.deadline && new Date(item.deadline) <= now) {
        item.status = 'expired'
      }
      return item
    })

    return c.json({
      code: 0, message: 'success',
      data: { list, total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 发布拼团（需登录）
groupbuy.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any
    const body = await c.req.json()

    const { title, description, originalPrice, groupPrice, targetCount, deadline, images, category, contactWechat, contactPhone } = body

    // 校验
    if (!title || !title.trim()) {
      return c.json({ code: 400, message: '标题不能为空' }, 400)
    }
    if (!groupPrice || Number(groupPrice) <= 0) {
      return c.json({ code: 400, message: '拼团价必须大于0' }, 400)
    }
    if (!targetCount || Number(targetCount) < 2) {
      return c.json({ code: 400, message: '目标人数至少2人' }, 400)
    }
    if (!deadline) {
      return c.json({ code: 400, message: '请设置截止时间' }, 400)
    }
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return c.json({ code: 400, message: '截止时间格式不正确' }, 400)
    }
    if (deadlineDate.getTime() <= Date.now()) {
      return c.json({ code: 400, message: '截止时间必须在未来' }, 400)
    }

    const now = new Date()
    const gbData = {
      title: title.trim(),
      description: description?.trim() || '',
      originalPrice: originalPrice ? Number(originalPrice) : Number(groupPrice),
      groupPrice: Number(groupPrice),
      targetCount: Number(targetCount),
      deadline: deadlineDate,
      images: images || [],
      category: category || '',
      contactWechat: contactWechat || '',
      contactPhone: contactPhone || '',
      organizerId: user.openid,
      organizerInfo: {
        openid: user.openid,
        nickname: user.nickname || '',
        avatar: user.avatar || '',
      },
      currentCount: 1, // 发起人自动参团
      participants: [user.openid],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    const res = await getCollection('groupbuys').add(gbData)

    return c.json({ code: 0, message: '发布成功', data: { id: res.id } })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 我参与/发起的拼团列表（必须在 /:id 之前定义）
groupbuy.get('/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any
    const { page = '1', pageSize = '20' } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    // 查询 participants 包含我的 openid 的拼团
    const [listRes, countRes] = await Promise.all([
      getCollection('groupbuys')
        .where({ participants: user.openid })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(ps)
        .get(),
      getCollection('groupbuys')
        .where({ participants: user.openid })
        .count(),
    ])

    // 实时修正过期状态
    const now = new Date()
    const list = (listRes.data || []).map((item: any) => {
      if (item.status === 'pending' && item.deadline && new Date(item.deadline) <= now) {
        item.status = 'expired'
      }
      return item
    })

    return c.json({
      code: 0,
      message: 'success',
      data: { list, total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 我发起的拼团（必须在 /:id 之前定义）
groupbuy.get('/my/organized', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any
    const { page = '1', pageSize = '20' } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    const [listRes, countRes] = await Promise.all([
      getCollection('groupbuys')
        .where({ organizerId: user.openid })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(ps)
        .get(),
      getCollection('groupbuys')
        .where({ organizerId: user.openid })
        .count(),
    ])

    // 实时修正过期状态
    const now2 = new Date()
    const organizedList = (listRes.data || []).map((item: any) => {
      if (item.status === 'pending' && item.deadline && new Date(item.deadline) <= now2) {
        item.status = 'expired'
      }
      return item
    })

    return c.json({
      code: 0,
      message: 'success',
      data: { list: organizedList, total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 拼团详情（公开）
groupbuy.get('/:id', async (c) => {
  try {
    const { id } = c.req.param()

    const res = await getCollection('groupbuys').doc(id).get()
    // CloudBase .doc().get() 返回 res.data 可能是类数组对象，取第一个元素
    let gb: any = res.data
    if (Array.isArray(gb)) {
      gb = gb[0]
    } else if (gb && typeof gb === 'object' && gb[0] !== undefined) {
      gb = gb[0]
    }

    if (!gb || !gb._id) return c.json({ code: 404, message: '拼团不存在' }, 404)

    // 实时修正过期状态
    if (gb.status === 'pending' && gb.deadline && new Date(gb.deadline) <= new Date()) {
      await getCollection('groupbuys').doc(id).update({ status: 'expired', updatedAt: new Date() })
      gb.status = 'expired'
    }

    // 检查当前用户是否已参团
    let isJoined = false
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'hi-neighbor-jwt-secret-2026'
        const payload = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET) as any
        isJoined = (gb.participants || []).includes(payload.openid)
      } catch {
        // token 无效或过期，忽略
      }
    }

    // 查询参与者信息
    let participantInfos: any[] = []
    if (gb.participants && gb.participants.length > 0) {
      const cmd = getDb().command
      const userRes = await getCollection('users').where({ openid: cmd.in(gb.participants) }).get()
      participantInfos = (userRes.data || []).map((u: any) => ({
        openid: u.openid,
        nickname: u.nickname || '微信用户',
        avatar: u.avatar || '',
      }))
    }

    return c.json({
      code: 0,
      message: 'success',
      data: { _id: gb._id, title: gb.title, description: gb.description, originalPrice: gb.originalPrice, groupPrice: gb.groupPrice, targetCount: gb.targetCount, deadline: gb.deadline, images: gb.images, category: gb.category, contactWechat: gb.contactWechat, contactPhone: gb.contactPhone, organizerId: gb.organizerId, organizerInfo: gb.organizerInfo, currentCount: gb.currentCount, participants: gb.participants, participantInfos, status: gb.status, createdAt: gb.createdAt, updatedAt: gb.updatedAt, isJoined },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 参团
groupbuy.post('/:id/join', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any
    const { id } = c.req.param()

    const res = await getCollection('groupbuys').doc(id).get()
    let gb: any = res.data
    if (Array.isArray(gb)) { gb = gb[0] } else if (gb && typeof gb === 'object' && gb[0] !== undefined) { gb = gb[0] }

    if (!gb || !gb._id) return c.json({ code: 404, message: '拼团不存在' }, 404)

    // 实时检查 deadline
    if (gb.status === 'pending' && gb.deadline && new Date(gb.deadline) <= new Date()) {
      await getCollection('groupbuys').doc(id).update({ status: 'expired', updatedAt: new Date() })
      return c.json({ code: 400, message: '拼团已结束' }, 400)
    }

    if (gb.status !== 'pending') return c.json({ code: 400, message: '拼团已结束' }, 400)
    if (gb.participants?.includes(user.openid)) return c.json({ code: 400, message: '已参团' }, 400)

    const newCount = (gb.currentCount || 0) + 1
    const newParticipants = [...(gb.participants || []), user.openid]
    const newStatus = newCount >= gb.targetCount ? 'successful' : 'pending'

    await getCollection('groupbuys').doc(id).update({
      currentCount: newCount,
      participants: newParticipants,
      status: newStatus,
      updatedAt: new Date(),
    })

    return c.json({ code: 0, message: 'success', data: { currentCount: newCount, status: newStatus } })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 取消参团（需登录）
groupbuy.post('/:id/leave', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any
    const { id } = c.req.param()

    const res = await getCollection('groupbuys').doc(id).get()
    let gb: any = res.data
    if (Array.isArray(gb)) { gb = gb[0] } else if (gb && typeof gb === 'object' && gb[0] !== undefined) { gb = gb[0] }

    if (!gb || !gb._id) return c.json({ code: 404, message: '拼团不存在' }, 404)
    if (gb.status !== 'pending') return c.json({ code: 400, message: '拼团已结束，无法退出' }, 400)
    if (!(gb.participants || []).includes(user.openid)) return c.json({ code: 400, message: '您未参团' }, 400)

    const newParticipants = (gb.participants || []).filter((p: string) => p !== user.openid)
    const newCount = newParticipants.length

    // 如果没人了，标记为 expired
    const newStatus = newCount === 0 ? 'expired' : gb.status

    await getCollection('groupbuys').doc(id).update({
      currentCount: newCount,
      participants: newParticipants,
      status: newStatus,
      updatedAt: new Date(),
    })

    return c.json({ code: 0, message: '已退出拼团', data: { currentCount: newCount, status: newStatus } })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default groupbuy
