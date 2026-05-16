import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref<any>(uni.getStorageSync('userInfo') || {})

  async function login() {
    // 获取微信登录code
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        if (!loginRes.code) {
          uni.showToast({ title: '登录失败', icon: 'none' })
          return
        }
        try {
          const data = await authApi.login(loginRes.code)
          token.value = data.token
          userInfo.value = data.userInfo
          uni.setStorageSync('token', data.token)
          uni.setStorageSync('userInfo', data.userInfo)
          uni.showToast({ title: '登录成功', icon: 'success' })

          // 尝试获取微信头像昵称（用户可能拒绝，静默处理）
          tryGetWxProfile()
        } catch {
          uni.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '登录失败', icon: 'none' })
      },
    })
  }

  // 尝试获取微信用户信息（头像+昵称）
  async function tryGetWxProfile() {
    try {
      uni.getUserProfile({
        desc: '用于完善个人资料',
        success: async (profileRes) => {
          const wxInfo = profileRes.userInfo
          if (wxInfo) {
            // 更新到后端
            await authApi.updateProfile({
              nickname: wxInfo.nickName || '',
              avatar: wxInfo.avatarUrl || '',
            })
            // 更新本地
            const newInfo = {
              ...userInfo.value,
              nickname: wxInfo.nickName || userInfo.value.nickname,
              avatar: wxInfo.avatarUrl || userInfo.value.avatar,
            }
            userInfo.value = newInfo
            uni.setStorageSync('userInfo', newInfo)
          }
        },
        fail: () => {
          // 用户拒绝授权，使用默认值，不影响登录
        },
      })
    } catch {
      // getUserProfile 不可用（基础库版本低等），忽略
    }
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
