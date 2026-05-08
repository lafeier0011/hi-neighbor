import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'

const location = new Hono()

// 获取推荐地址列表（公开，所有人可见）
location.get('/', async (c) => {
  try {
    const res = await getCollection('locations')
      .orderBy('orderBy', 'asc')
      .limit(100)
      .get()

    return c.json({
      code: 0,
      message: 'success',
      data: res.data || [],
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default location
