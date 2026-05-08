import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'
import { writeLog } from '../utils/logger'
import type { JwtPayload } from '../middleware/auth'

const favorites = new Hono()

// 收藏/取消收藏（toggle）
favorites.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { goodsId } = await c.req.json()

    if (!goodsId) {
      return c.json({ code: 400, message: '缺少商品ID' }, 400)
    }

    // 检查是否已收藏
    const existRes = await getCollection('favorites')
      .where({ userId: user.openid, goodsId })
      .limit(1)
      .get()

    if (existRes.data && existRes.data.length > 0) {
      // 已收藏 -> 取消
      await getCollection('favorites').doc(existRes.data[0]._id).remove()
      
      // 减少收藏数
      const goodRes = await getCollection('goods').doc(goodsId).get()
      const good = goodRes.data as any
      if (good) {
        await getCollection('goods').doc(goodsId).update({
          favCount: Math.max(0, (good.favCount || 0) - 1),
        })
      }

      return c.json({ code: 0, message: 'success', data: { favorited: false } })
    } else {
      // 未收藏 -> 添加
      await getCollection('favorites').add({
        userId: user.openid,
        goodsId,
        createdAt: new Date(),
      })

      // 增加收藏数
      const goodRes = await getCollection('goods').doc(goodsId).get()
      const good = goodRes.data as any
      if (good) {
        await getCollection('goods').doc(goodsId).update({
          favCount: (good.favCount || 0) + 1,
        })
      }

      return c.json({ code: 0, message: 'success', data: { favorited: true } })
    }
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 获取我的收藏列表
favorites.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JwtPayload
    const { page = '1', pageSize = '20' } = c.req.query()
    const p = Number(page)
    const ps = Number(pageSize)
    const skip = (p - 1) * ps

    // 获取收藏列表
    const favRes = await getCollection('favorites')
      .where({ userId: user.openid })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(ps)
      .get()

    const favList = favRes.data || []
    
    if (favList.length === 0) {
      return c.json({ code: 0, message: 'success', data: { list: [], total: 0, page: p, pageSize: ps } })
    }

    // 获取对应商品详情
    const goodsIds = favList.map((f: any) => f.goodsId)
    const goodsRes = await getCollection('goods')
      .where({ _id: goodsIds.length === 1 ? goodsIds[0] : { $in: goodsIds } })
      .get()

    const goodsMap = new Map(
      (goodsRes.data || []).map((g: any) => [g._id, g])
    )

    const list = favList.map((f: any) => {
      const g = goodsMap.get(f.goodsId)
      return g ? { ...g, _favId: f._id, _favAt: f.createdAt } : null
    }).filter(Boolean) as any[]

    return c.json({
      code: 0,
      message: 'success',
      data: { list, total: favList.length, page: p, pageSize: ps },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default favorites
