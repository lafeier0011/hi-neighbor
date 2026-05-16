<template>
  <div class="login-page">
    <div class="login-card">
      <h2>邻趣集市</h2>
      <p>管理后台</p>
      <div class="form-group">
        <label>管理员账号</label>
        <input v-model="form.username" placeholder="请输入账号" @keyup.enter="login" />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="login" />
      </div>
      <p v-if="error" style="color: #c0392b; font-size: 13px; margin-top: 8px;">{{ error }}</p>
      <button class="btn primary" @click="login">登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()
const form = reactive({ username: '', password: '' })
const error = ref('')

async function login() {
  error.value = ''
  if (!form.username || !form.password) { error.value = '请填写账号和密码'; return }
  try {
    const res: any = await api.post('/api/auth/admin/login', form)
    localStorage.setItem('admin_token', res.data.token)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  }
}
</script>
