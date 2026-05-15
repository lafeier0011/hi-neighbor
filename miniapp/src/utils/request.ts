import ENV from './config'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header: any = {
      'Content-Type': 'application/json',
    }
    if (options.needAuth !== false && token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: `${ENV.BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        const data = res.data as any
        if (data.code === 0) {
          resolve(data.data)
        } else if (data.code === 401) {
          // 登录过期，跳转登录
          uni.removeStorageSync('token')
          uni.showToast({ title: '请重新登录', icon: 'none' })
          reject(data)
        } else {
          uni.showToast({ title: data.message || '请求失败', icon: 'none' })
          reject(data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const http = {
  get: <T = any>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'GET', data, needAuth }),

  post: <T = any>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'POST', data, needAuth }),

  put: <T = any>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'PUT', data, needAuth }),

  delete: <T = any>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'DELETE', data, needAuth }),

  /** 上传单个文件，返回 { url } */
  uploadFile(filePath: string): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const token = getToken()
      uni.uploadFile({
        url: `${ENV.BASE_URL}/api/upload`,
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败', icon: 'none' })
          reject(err)
        },
      })
    })
  },
}
