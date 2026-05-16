import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
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

    return c.json({
      code: 0, message: 'success',
      data: { list: listRes.data || [], total: countRes.total || 0, page: p, pageSize: ps },
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
    const gb = res.data as any

    if (!gb) return c.json({ code: 404, message: '拼团不存在' }, 404)
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

// 获取我参与/发起的拼团列表
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

    return c.json({
      code: 0,
      message: 'success',
      data: { list: listRes.data || [], total: countRes.total || 0, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default groupbuy
