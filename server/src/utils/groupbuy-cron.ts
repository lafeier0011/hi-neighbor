import { getCollection } from './cloudbase'

/**
 * 检查并处理过期的拼团
 * 将所有 status='pending' 且 deadline < now 的拼团标记为 expired
 */
export async function checkExpiredGroupbuys() {
  try {
    const now = new Date()
    console.log(`[groupbuy-cron] 检查过期拼团... 当前时间: ${now.toISOString()}`)

    // 查询所有 pending 且 deadline 已过的拼团
    const res = await getCollection('groupbuys')
      .where({
        status: 'pending',
        deadline: getCollection('groupbuys').db.command.lt(now),
      })
      .get()

    const expiredList = res.data || []
    if (expiredList.length === 0) {
      console.log('[groupbuy-cron] 没有需要处理的过期拼团')
      return
    }

    console.log(`[groupbuy-cron] 发现 ${expiredList.length} 个过期拼团，开始更新...`)

    // 批量更新
    for (const gb of expiredList) {
      await getCollection('groupbuys').doc(gb._id).update({
        status: 'expired',
        updatedAt: now,
      })
    }

    console.log(`[groupbuy-cron] 成功处理 ${expiredList.length} 个过期拼团`)
  } catch (e: any) {
    console.error('[groupbuy-cron] 检查过期拼团失败:', e.message)
  }
}
