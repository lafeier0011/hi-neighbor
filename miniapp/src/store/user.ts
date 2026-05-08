import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref<any>(uni.getStorageSync('userInfo') || {})

  async function login() {
    // 获取微信登录code
    const [loginErr, loginRes] = await uni.login({ provider: 'weixin' })
    if (loginErr || !loginRes?.code) {
      uni.showToast({ title: '登录失败', icon: 'none' })
      return
    }

    const data = await authApi.login(loginRes.code)
    token.value = data.token
    userInfo.value = data.userInfo
    uni.setStorageSync('token', data.token)
    uni.setStorageSync('userInfo', data.userInfo)
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  function isLoggedIn() {
    return !!token.value
  }

  return { token, userInfo, login, logout, isLoggedIn }
})
