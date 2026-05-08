import { Hono } from 'hono'

// 商品自动下架定时器（CloudBase定时触发器调用）
export const autoOfflineHandler = async () => {
  const { getCollection } = require('../utils/cloudbase')
  
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  try {
    // 查找sold状态且soldAt超过24小时的商品
    const res = await getCollection('goods')
      .where({
        status: 'sold',
        soldAt: { $lt: oneDayAgo },
      })
      .limit(100)
      .get()

    const goods = res.data || []
    console.log(`Found ${goods.length} goods to auto-offline`)

    for (const good of goods) {
      await getCollection('goods').doc(good._id).update({
        status: 'offline',
        updatedAt: now,
      })

      // 记录日志
      await getCollection('admin_logs').add({
        operatorId: 'system',
        operatorName: '系统',
        type: 'update',
        content: `自动下架「${good.title}」（已卖出超过24小时）`,
        targetId: good._id,
        ip: 'server',
        createdAt: now,
      })
    }

    return { offlineCount: goods.length }
  } catch (e) {
    console.error('Auto-offline error:', e)
    return { error: e }
  }
}
