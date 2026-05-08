<template>
  <div>
    <div class="page-header">
      <h1>用户管理</h1>
      <p>查看和管理注册用户</p>
    </div>

    <div class="search-bar">
      <input v-model="keyword" placeholder="搜索用户昵称..." @keyup.enter="fetchList(true)" />
      <button class="btn primary" @click="fetchList(true)">搜索</button>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>微信昵称</th>
            <th>角色</th>
            <th>状态</th>
            <th>发布数</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in list" :key="u._id">
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #ebe4da;" />
                <span style="font-weight: 500;">{{ u.nickname || '用户' }}</span>
              </div>
            </td>
            <td>{{ u.nickname || '-' }}</td>
            <td>{{ u.role || 'user' }}</td>
            <td><span class="badge" :class="u.disabled ? 'disabled' : 'active'">{{ u.disabled ? '已禁用' : '正常' }}</span></td>
            <td>{{ u.publishedCount || 0 }}</td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button v-if="u.role !== 'admin'" class="btn sm outline" @click="setRole(u._id, 'admin')">设管理员</button>
              <button v-if="u.role === 'admin'" class="btn sm outline" @click="setRole(u._id, 'user')">取消管理员</button>
              <button v-if="!u.disabled" class="btn sm danger" @click="toggleDisable(u._id, true)">禁用</button>
              <button v-if="u.disabled" class="btn sm outline" @click="toggleDisable(u._id, false)">解禁</button>
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
const page = ref(1)
const totalPages = ref(1)

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

async function fetchList(reset = false) {
  if (reset) page.value = 1
  try {
    const params: any = { page: page.value, pageSize: 20 }
    if (keyword.value) params.keyword = keyword.value
    const res: any = await api.get('/admin/users', { params })
    list.value = res.data.list || []
    totalPages.value = Math.ceil((res.data.total || 0) / 20) || 1
  } catch {}
}

async function setRole(id: string, role: string) {
  try {
    await api.put(`/admin/users/${id}/role`, { role })
    fetchList()
  } catch {}
}

async function toggleDisable(id: string, disabled: boolean) {
  try {
    await api.put(`/admin/users/${id}/disable`, { disabled })
    fetchList()
  } catch {}
}

onMounted(() => fetchList())
</script>
