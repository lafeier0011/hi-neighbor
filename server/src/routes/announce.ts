import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'

const announce = new Hono()

// 公告列表（公开）
announce.get('/', async (c) => {
  try {
    const res = await getCollection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    return c.json({ code: 0, message: 'success', data: { list: res.data || [] } })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default announce
