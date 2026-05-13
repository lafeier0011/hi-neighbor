import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'

const location = new Hono()

// 获取推荐地址 + 社区名称列表（公开，按 type 分组返回）
location.get('/', async (c) => {
  try {
    const res = await getCollection('locations')
      .orderBy('orderBy', 'asc')
      .limit(100)
      .get()

    const all = (res.data || []) as any[]
    const communities = all.filter((item: any) => item.type === 'community')
    const locations = all.filter((item: any) => item.type === 'location')

    return c.json({
      code: 0,
      message: 'success',
      data: { communities, locations },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default location
