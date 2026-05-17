import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'

// 判断是否为 H5 环境
function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref<any>(uni.getStorageSync('userInfo') || {})

  async function login() {
    if (isH5()) {
      // H5 环境：使用账号密码登录
      h5Login()
      return
    }
    // 微信小程序登录
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

  // H5 账号密码登录弹窗
  function h5Login() {
    // #ifdef H5
    // 创建登录弹窗
    const overlay = document.createElement('div')
    overlay.id = 'h5-login-overlay'
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;'
    
    const box = document.createElement('div')
    box.style.cssText = 'background:#fff;border-radius:16px;padding:32px 24px;width:300px;max-width:85vw;'
    
    box.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:20px;font-weight:600;color:#2d2a26;">邻趣集市</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">账号密码登录</div>
      </div>
      <input id="h5-login-user" type="text" placeholder="请输入用户名" 
        style="width:100%;padding:12px 16px;border:1px solid #ebe4da;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;outline:none;" />
      <input id="h5-login-pass" type="password" placeholder="请输入密码" 
        style="width:100%;padding:12px 16px;border:1px solid #ebe4da;border-radius:8px;font-size:14px;margin-bottom:16px;box-sizing:border-box;outline:none;" />
      <div id="h5-login-submit" 
        style="width:100%;padding:12px;background:#c2703e;border-radius:8px;text-align:center;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">
        登录 / 注册
      </div>
      <div style="text-align:center;margin-top:12px;font-size:12px;color:#999;">
        新用户将自动注册
      </div>
    `
    overlay.appendChild(box)
    document.body.appendChild(overlay)

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay)
      }
    })

    // 登录按钮
    const submitBtn = document.getElementById('h5-login-submit')!
    submitBtn.addEventListener('click', async () => {
      const username = (document.getElementById('h5-login-user') as HTMLInputElement).value.trim()
      const password = (document.getElementById('h5-login-pass') as HTMLInputElement).value.trim()

      if (!username || !password) {
        ;(window as any).uni.showToast({ title: '请输入账号密码', icon: 'none' })
        return
      }

      submitBtn.textContent = '登录中...'
      ;(submitBtn as HTMLElement).style.opacity = '0.6'

      try {
        const data = await authApi.h5Login(username, password)
        token.value = data.token
        userInfo.value = data.userInfo
        uni.setStorageSync('token', data.token)
        uni.setStorageSync('userInfo', data.userInfo)
        document.body.removeChild(overlay)
        uni.showToast({ title: '登录成功', icon: 'success' })
      } catch (err: any) {
        submitBtn.textContent = '登录 / 注册'
        ;(submitBtn as HTMLElement).style.opacity = '1'
        uni.showToast({ title: err?.message || '登录失败', icon: 'none' })
      }
    })
    // #endif
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
