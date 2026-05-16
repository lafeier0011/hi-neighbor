import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'
import type { JwtPayload } from '../middleware/auth'

const feedbackRoutes = new Hono()

// 所有反馈接口都需要登录
feedbackRoutes.use('*', authMiddleware)

// 提交反馈
feedbackRoutes.post('/', async (c) => {
  const user = c.get('user') as JwtPayload
  const body = await c.req.json()

  const { content, contact, images } = body

  if (!content || !content.trim()) {
    return c.json({ code: 400, message: '请输入反馈内容' }, 400)
  }

  if (content.length > 500) {
    return c.json({ code: 400, message: '反馈内容不能超过500字' }, 400)
  }

  // images 最多3张
  const safeImages = Array.isArray(images) ? images.slice(0, 3) : []

  try {
    const feedbackData = {
      userId: user.openid,
      content: content.trim(),
      contact: contact || '',
      images: safeImages,
      reply: '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const addRes = await getCollection('feedbacks').add(feedbackData)

    return c.json({
      code: 0,
      message: 'success',
      data: { _id: addRes.id },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 我的反馈列表
feedbackRoutes.get('/mine', async (c) => {
  const user = c.get('user') as JwtPayload
  const { page = '1', pageSize = '20' } = c.req.query()
  const p = Number(page)
  const ps = Number(pageSize)
  const skip = (p - 1) * ps

  try {
    const [listRes, countRes] = await Promise.all([
      getCollection('feedbacks')
        .where({ userId: user.openid })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(ps)
        .get(),
      getCollection('feedbacks')
        .where({ userId: user.openid })
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

export default feedbackRoutes
