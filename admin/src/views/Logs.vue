<template>
  <div>
    <div class="page-header">
      <h1>操作日志</h1>
      <p>所有管理操作记录，不可篡改</p>
    </div>

    <div class="search-bar">
      <select v-model="actionFilter" @change="fetchList(true)">
        <option value="">全部类型</option>
        <option value="goods">商品操作</option>
        <option value="user">用户操作</option>
        <option value="announce">公告操作</option>
        <option value="location">地址操作</option>
      </select>
      <input v-model="keyword" placeholder="搜索操作内容..." @keyup.enter="fetchList(true)" />
      <button class="btn primary" @click="fetchList(true)">搜索</button>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>类型</th>
            <th>操作</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in list" :key="log._id">
            <td style="white-space: nowrap;">{{ formatDate(log.createdAt) }}</td>
            <td>{{ log.adminName || '-' }}</td>
            <td><span class="badge" :class="log.module || ''">{{ log.module || '-' }}</span></td>
            <td style="font-weight: 500;">{{ log.action }}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #999;">
              {{ log.detail || '-' }}
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
const actionFilter = ref('')
const page = ref(1)
const totalPages = ref(1)

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

async function fetchList(reset = false) {
  if (reset) page.value = 1
  try {
    const params: any = { page: page.value, pageSize: 30 }
    if (keyword.value) params.keyword = keyword.value
    if (actionFilter.value) params.module = actionFilter.value
    const res: any = await api.get('/admin/logs', { params })
    list.value = res.data.list || []
    totalPages.value = Math.ceil((res.data.total || 0) / 30) || 1
  } catch {}
}

onMounted(() => fetchList())
</script>
