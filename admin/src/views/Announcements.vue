<template>
  <div>
    <div class="page-header">
      <h1>公告管理</h1>
      <p>发布和管理社区公告</p>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <button class="btn primary" @click="openEditor()">发布公告</button>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>标题</th>
            <th>类型</th>
            <th>置顶</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in list" :key="a._id">
            <td style="font-weight: 500;">{{ a.title }}</td>
            <td>{{ typeText(a.type) }}</td>
            <td>{{ a.pinned ? '是' : '否' }}</td>
            <td>{{ formatDate(a.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button class="btn sm outline" @click="openEditor(a)">编辑</button>
              <button v-if="!a.pinned" class="btn sm outline" @click="togglePin(a._id, true)">置顶</button>
              <button v-if="a.pinned" class="btn sm outline" @click="togglePin(a._id, false)">取消置顶</button>
              <button class="btn sm danger" @click="remove(a._id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editorVisible" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100;">
      <div style="width: 500px; background: #fff; border-radius: 12px; padding: 32px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">{{ editId ? '编辑公告' : '发布公告' }}</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="form.title" placeholder="公告标题" />
        </div>
        <div class="form-group">
          <label>类型</label>
          <select v-model="form.type">
            <option value="notice">温馨提示</option>
            <option value="event">社区活动</option>
            <option value="urgent">重要通知</option>
          </select>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea v-model="form.content" placeholder="公告内容..." />
        </div>
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button class="btn primary" @click="saveAnnounce" style="flex: 1;">保存</button>
          <button class="btn outline" @click="editorVisible = false" style="flex: 1;">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '../utils/api'

const list = ref<any[]>([])
const editorVisible = ref(false)
const editId = ref('')
const form = reactive({ title: '', type: 'notice', content: '' })

function typeText(t: string) {
  const m: any = { urgent: '重要通知', event: '社区活动', notice: '温馨提示' }
  return m[t] || '通知'
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

function openEditor(item?: any) {
  if (item) {
    editId.value = item._id
    form.title = item.title
    form.type = item.type
    form.content = item.content
  } else {
    editId.value = ''
    form.title = ''
    form.type = 'notice'
    form.content = ''
  }
  editorVisible.value = true
}

async function fetchList() {
  try {
    const res: any = await api.get('/admin/announcements')
    list.value = res.data.list || []
  } catch {}
}

async function saveAnnounce() {
  if (!form.title || !form.content) return alert('请填写完整')
  try {
    if (editId.value) {
      await api.put(`/admin/announcements/${editId.value}`, form)
    } else {
      await api.post('/admin/announcements', form)
    }
    editorVisible.value = false
    fetchList()
  } catch {}
}

async function togglePin(id: string, pinned: boolean) {
  try {
    await api.put(`/admin/announcements/${id}/pin`, { pinned })
    fetchList()
  } catch {}
}

async function remove(id: string) {
  if (!confirm('确定删除该公告？')) return
  try {
    await api.delete(`/admin/announcements/${id}`)
    fetchList()
  } catch {}
}

onMounted(() => fetchList())
</script>
