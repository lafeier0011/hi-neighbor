<template>
  <div>
    <div class="page-header">
      <h1>推荐地址</h1>
      <p>管理发布页的交易地点选项</p>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <button class="btn primary" @click="openEditor()">添加地址</button>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>地址名称</th>
            <th>排序</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loc in list" :key="loc._id">
            <td style="font-weight: 500;">{{ loc.name }}</td>
            <td>{{ loc.sort || 0 }}</td>
            <td>{{ formatDate(loc.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button class="btn sm outline" @click="openEditor(loc)">编辑</button>
              <button class="btn sm danger" @click="remove(loc._id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editorVisible" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100;">
      <div style="width: 400px; background: #fff; border-radius: 12px; padding: 32px;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">{{ editId ? '编辑地址' : '添加地址' }}</h3>
        <div class="form-group">
          <label>地址名称</label>
          <input v-model="form.name" placeholder="如：小区南门、快递柜旁" />
        </div>
        <div class="form-group">
          <label>排序（数字越小越靠前）</label>
          <input v-model.number="form.sort" type="number" />
        </div>
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button class="btn primary" @click="save" style="flex: 1;">保存</button>
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
const form = reactive({ name: '', sort: 0 })

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

function openEditor(item?: any) {
  if (item) {
    editId.value = item._id
    form.name = item.name
    form.sort = item.sort || 0
  } else {
    editId.value = ''
    form.name = ''
    form.sort = list.value.length
  }
  editorVisible.value = true
}

async function fetchList() {
  try {
    const res: any = await api.get('/admin/locations')
    list.value = res.data.list || []
  } catch {}
}

async function save() {
  if (!form.name) return alert('请输入地址名称')
  try {
    if (editId.value) {
      await api.put(`/admin/locations/${editId.value}`, form)
    } else {
      await api.post('/admin/locations', form)
    }
    editorVisible.value = false
    fetchList()
  } catch {}
}

async function remove(id: string) {
  if (!confirm('确定删除？')) return
  try {
    await api.delete(`/admin/locations/${id}`)
    fetchList()
  } catch {}
}

onMounted(() => fetchList())
</script>
