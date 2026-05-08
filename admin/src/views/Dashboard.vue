<template>
  <div>
    <div class="page-header">
      <h1>仪表盘</h1>
      <p>邻趣集市运营概览</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card accent">
        <div class="label">在售商品</div>
        <div class="value">{{ stats.goodsOnSale }}</div>
      </div>
      <div class="stat-card">
        <div class="label">注册用户</div>
        <div class="value">{{ stats.users }}</div>
      </div>
      <div class="stat-card">
        <div class="label">进行中拼团</div>
        <div class="value">{{ stats.groupbuys }}</div>
      </div>
      <div class="stat-card">
        <div class="label">今日成交</div>
        <div class="value">{{ stats.todaySold }}</div>
      </div>
    </div>

    <div class="card" style="margin-top: 24px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">最近商品</h3>
      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>价格</th>
            <th>发布者</th>
            <th>状态</th>
            <th>发布时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in recentGoods" :key="g._id">
            <td>{{ g.title }}</td>
            <td>¥{{ g.price }}</td>
            <td>{{ g.publisherInfo?.nickname || '-' }}</td>
            <td><span class="badge" :class="g.status">{{ statusText(g.status) }}</span></td>
            <td>{{ formatDate(g.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const stats = ref({ goodsOnSale: 0, users: 0, groupbuys: 0, todaySold: 0 })
const recentGoods = ref<any[]>([])

function statusText(s: string) {
  const m: any = { on_sale: '在售', sold: '已卖出', offline: '已下架', deleted: '已删除' }
  return m[s] || s
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

onMounted(async () => {
  try {
    const res: any = await api.get('/admin/dashboard')
    stats.value = res.data.stats || stats.value
    recentGoods.value = res.data.recentGoods || []
  } catch {}
})
</script>
