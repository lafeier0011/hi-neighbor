import { http } from '../utils/request'

export const goodsApi = {
  /** 商品列表 */
  getList(params: { page?: number; pageSize?: number; category?: string; keyword?: string }) {
    return http.get('/api/goods', params, false)
  },

  /** 商品详情 */
  getDetail(id: string) {
    return http.get(`/api/goods/${id}`, undefined, false)
  },

  /** 发布商品 */
  publish(data: any) {
    return http.post('/api/goods', data)
  },

  /** 标记已卖出 */
  markSold(id: string) {
    return http.put(`/api/goods/${id}/sell`)
  },

  /** 删除商品 */
  deleteGoods(id: string) {
    return http.delete(`/api/goods/${id}`)
  },
}

export const authApi = {
  /** 微信登录 */
  login(code: string) {
    return http.post('/api/auth/login', { code }, false)
  },

  /** 获取用户信息 */
  getProfile() {
    return http.get('/api/auth/profile')
  },

  /** 更新用户信息 */
  updateProfile(data: any) {
    return http.put('/api/auth/profile', data)
  },

  /** 获取我发布的商品列表 */
  getMyGoods(params: { page?: number; pageSize?: number; status?: string }) {
    return http.get('/api/auth/my-goods', params)
  },

  /** 获取我的统计数据 */
  getMyStats() {
    return http.get('/api/auth/my-stats')
  },
}

export const favoritesApi = {
  /** 收藏/取消 */
  toggle(goodsId: string) {
    return http.post('/api/favorites', { goodsId })
  },

  /** 我的收藏 */
  getList(params: { page?: number; pageSize?: number }) {
    return http.get('/api/favorites', params)
  },
}

export const locationApi = {
  /** 获取推荐地址 */
  getList() {
    return http.get('/api/locations', undefined, false)
  },
}

export const announceApi = {
  /** 公告列表 */
  getList() {
    return http.get('/api/announcements', undefined, false)
  },
}

export const groupbuyApi = {
  /** 拼团列表 */
  getList(params?: any) {
    return http.get('/api/groupbuys', params, false)
  },

  /** 拼团详情 */
  getDetail(id: string) {
    return http.get(`/api/groupbuys/${id}`, undefined, true)
  },

  /** 参团 */
  join(id: string) {
    return http.post(`/api/groupbuys/${id}/join`)
  },

  /** 取消参团 */
  leave(id: string) {
    return http.post(`/api/groupbuys/${id}/leave`)
  },

  /** 发布拼团 */
  create(data: any) {
    return http.post('/api/groupbuys', data)
  },

  /** 我参与/发起的拼团 */
  getMyList(params?: { page?: number; pageSize?: number }) {
    return http.get('/api/groupbuys/my', params)
  },

  /** 我发起的拼团 */
  getMyOrganized(params?: { page?: number; pageSize?: number }) {
    return http.get('/api/groupbuys/my/organized', params)
  },
}

export const addressApi = {
  /** 获取地址列表 */
  getList() {
    return http.get('/api/addresses')
  },

  /** 新增地址 */
  create(data: { receiverName: string; phone: string; detail: string; isDefault?: boolean }) {
    return http.post('/api/addresses', data)
  },

  /** 编辑地址 */
  update(id: string, data: { receiverName: string; phone: string; detail: string; isDefault?: boolean }) {
    return http.put(`/api/addresses/${id}`, data)
  },

  /** 删除地址 */
  delete(id: string) {
    return http.delete(`/api/addresses/${id}`)
  },
}

export const feedbackApi = {
  /** 提交反馈 */
  create(data: { content: string; contact?: string; images?: string[] }) {
    return http.post('/api/feedback', data)
  },

  /** 我的反馈列表 */
  getMine(params?: { page?: number; pageSize?: number }) {
    return http.get('/api/feedback/mine', params)
  },
}
