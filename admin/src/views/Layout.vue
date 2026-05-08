<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-brand">邻趣集市</div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="sidebar-item"
          active-class="active"
        >
          <span class="sidebar-item-dot" />
          {{ item.label }}
        </router-link>
        <a class="sidebar-item" style="margin-top: auto;" @click="logout">
          <span class="sidebar-item-dot" />
          退出登录
        </a>
      </nav>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const menu = [
  { path: '/dashboard', label: '仪表盘' },
  { path: '/goods', label: '商品管理' },
  { path: '/users', label: '用户管理' },
  { path: '/announcements', label: '公告管理' },
  { path: '/locations', label: '推荐地址' },
  { path: '/logs', label: '操作日志' },
]

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>
