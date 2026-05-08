<template>
  <div>
    <div class="page-header">
      <h1>商品管理</h1>
      <p>管理所有在售/已卖出/已下架商品</p>
    </div>

    <div class="search-bar">
      <input v-model="keyword" placeholder="搜索商品名称..." @keyup.enter="fetchList(true)" />
      <select v-model="statusFilter" @change="fetchList(true)">
        <option value="">全部状态</option>
        <option value="on_sale">在售</option>
        <option value="sold">已卖出</option>
        <option value="offline">已下架</option>
        <option value="deleted">已删除</option>
      </select>
      <button class="btn primary" @click="fetchList(true)">搜索</button>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>价格</th>
            <th>成色</th>
            <th>发布者</th>
            <th>状态</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in list" :key="g._id">
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ g.title }}
            </td>
            <td>¥{{ g.price }}</td>
            <td>{{ g.condition }}</td>
            <td>{{ g.publisherInfo?.nickname || '-' }}</td>
            <td><span class="badge" :class="g.status">{{ statusText(g.status) }}</span></td>
            <td>{{ formatDate(g.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button v-if="g.status === 'on_sale'" class="btn sm outline" @click="changeStatus(g._id, 'offline')">下架</button>
              <button v-if="g.status === 'offline'" class="btn sm outline" @click="changeStatus(g._id, 'on_sale')">恢复</button>
              <button v-if="g.status !== 'deleted'" class="btn sm danger" @click="changeStatus(g._id, 'deleted')">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span style="padding: 6px 12px; font-size: 13px;">{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++; fetchList()">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const list = ref<any[]>([])
const keyword = ref('')
const statusFilter = ref('')
const page = ref(1)
const total = ref(0)
const pageSize = 20
const totalPages = ref(1)

function statusText(s: string) {
  const m: any = { on_sale: '在售', sold: '已卖出', offline: '已下架', deleted: '已删除' }
  return m[s] || s
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

async function fetchList(reset = false) {
  if (reset) page.value = 1
  try {
    const params: any = { page: page.value, pageSize }
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    const res: any = await api.get('/admin/goods', { params })
    list.value = res.data.list || []
    total.value = res.data.total || 0
    totalPages.value = Math.ceil(total.value / pageSize) || 1
  } catch {}
}

async function changeStatus(id: string, status: string) {
  const action = status === 'offline' ? '下架' : status === 'on_sale' ? '恢复' : '删除'
  if (!confirm(`确定${action}该商品？`)) return
  try {
    await api.put(`/admin/goods/${id}/status`, { status })
    fetchList()
  } catch {}
}

onMounted(() => fetchList())
</script>
