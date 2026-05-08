import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/Login.vue') },
    {
      path: '/',
      component: () => import('../views/Layout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('../views/Dashboard.vue') },
        { path: 'goods', component: () => import('../views/Goods.vue') },
        { path: 'users', component: () => import('../views/Users.vue') },
        { path: 'announcements', component: () => import('../views/Announcements.vue') },
        { path: 'locations', component: () => import('../views/Locations.vue') },
        { path: 'logs', component: () => import('../views/Logs.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) next('/login')
  else next()
})

export default router
