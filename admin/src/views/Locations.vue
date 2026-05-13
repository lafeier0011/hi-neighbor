<template>
  <div>
    <div class="page-header">
      <h1>地址与社区管理</h1>
      <p>管理社区名称（首页筛选）和推荐地址（交易地点）</p>
    </div>

    <!-- 社区名称 -->
    <div class="section-header">
      <h2>社区名称</h2>
      <p class="section-desc">用于首页左上角社区切换筛选</p>
      <button class="btn primary" @click="openEditor('community')">添加社区</button>
    </div>
    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>社区名称</th>
            <th>排序</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in communities" :key="item._id">
            <td style="font-weight: 500;">{{ item.name }}</td>
            <td>{{ item.orderBy || 0 }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button class="btn sm outline" @click="openEditor('community', item)">编辑</button>
              <button class="btn sm danger" @click="remove(item._id)">删除</button>
            </td>
          </tr>
          <tr v-if="!communities.length">
            <td colspan="4" style="text-align: center; color: #999; padding: 20px;">暂无社区</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 推荐地址 -->
    <div class="section-header" style="margin-top: 32px;">
      <h2>推荐地址</h2>
      <p class="section-desc">用于发布页交易地点选择</p>
      <button class="btn primary" @click="openEditor('location')">添加地址</button>
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
          <tr v-for="item in locations" :key="item._id">
            <td style="font-weight: 500;">{{ item.name }}</td>
            <td>{{ item.orderBy || 0 }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td style="display: flex; gap: 8px;">
              <button class="btn sm outline" @click="openEditor('location', item)">编辑</button>
              <button class="btn sm danger" @click="remove(item._id)">删除</button>
            </td>
          </tr>
          <tr v-if="!locations.length">
            <td colspan="4" style="text-align: center; color: #999; padding: 20px;">暂无地址</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editorVisible" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100;">
      <div style="width: 400px; background: #fff; border-radius: 12px; padding: 32px;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">
          {{ editId ? '编辑' : '添加' }}{{ editType === 'community' ? '社区' : '地址' }}
        </h3>
        <div class="form-group">
          <label>{{ editType === 'community' ? '社区名称' : '地址名称' }}</label>
          <input v-model="form.name" :placeholder="editType === 'community' ? '如：阳光花园、翡翠城' : '如：小区南门、快递柜旁'" />
        </div>
        <div class="form-group">
          <label>排序（数字越小越靠前）</label>
          <input v-model.number="form.orderBy" type="number" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../utils/api'

const list = ref<any[]>([])
const editorVisible = ref(false)
const editId = ref('')
const editType = ref<'community' | 'location'>('community')
const form = reactive({ name: '', orderBy: 0 })

const communities = computed(() => list.value.filter((l: any) => l.type === 'community'))
const locations = computed(() => list.value.filter((l: any) => l.type === 'location'))

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

function openEditor(type: 'community' | 'location', item?: any) {
  editType.value = type
  if (item) {
    editId.value = item._id
    form.name = item.name
    form.orderBy = item.orderBy || 0
  } else {
    editId.value = ''
    form.name = ''
    form.orderBy = list.value.length
  }
  editorVisible.value = true
}

async function fetchList() {
  try {
    const res: any = await api.get('/admin/locations')
    list.value = res.data || []
  } catch {}
}

async function save() {
  if (!form.name) return alert('请输入名称')
  try {
    if (editId.value) {
      await api.put(`/admin/locations/${editId.value}`, { ...form, type: editType.value })
    } else {
      await api.post('/admin/locations', { ...form, type: editType.value })
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

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.section-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}
</style>
