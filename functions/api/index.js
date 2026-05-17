// CloudBase Web Function (HTTP) 入口
// 需要启动一个 HTTP 服务监听指定端口

const http = require('http')
const url = require('url')
const crypto = require('crypto')

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
})
const db = app.database()
const dbCmd = db.command

// ============ JWT ============
const JWT_SECRET = process.env.JWT_SECRET || 'hi-neighbor-jwt-secret-2026'

function generateToken(payload) {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
  const data = { ...payload, exp }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payloadStr = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadStr}`).digest('base64url')
  return `${header}.${payloadStr}.${sig}`
}

function verifyToken(token) {
  try {
    const parts = token.replace('Bearer ', '').split('.')
    if (parts.length !== 3) return null
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url')
    if (parts[2] !== expected) return null
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch { return null }
}

function ok(data = null, message = 'success') { return { code: 0, message, data } }
function err(code = 500, message = 'error') { return { code, message } }

// ============ API 处理 ============

// 解析 body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch { resolve({}) }
    })
  })
}

// 认证中间件
function getUser(req) {
  const auth = req.headers['authorization']
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  return verifyToken(token)
}

// 路由处理
const handlers = {
  // -- 公开 --
  'POST /api/auth/login': async (req, body) => {
    const { code } = body
    if (!code) return err(400, '缺少登录code')
    try {
      const wxContext = await app.getOpenData({})
      const openid = wxContext.openid || `user_${Date.now()}`
      const userRes = await db.collection('users').where({ openid }).get()
      let user
      if (userRes.data?.length > 0) {
        user = userRes.data[0]
      } else {
        const newUser = { openid, nickname: '微信用户', avatar: '', community: '', role: 'user', disabled: false, createdAt: new Date(), updatedAt: new Date() }
        const addRes = await db.collection('users').add(newUser)
        user = { _id: addRes.id, ...newUser }
      }
      const token = generateToken({ openid, role: user.role })
      return ok({ token, userInfo: user })
    } catch (e) { return err(500, `登录失败: ${e.message}`) }
  },

  'POST /api/auth/adminLogin': async (req, body) => {
    const { username, password } = body
    if (!username || !password) return err(400, '请输入账号和密码')
    const res = await db.collection('admin_accounts').where({ username, password }).get()
    if (!res.data?.length) return err(401, '账号或密码错误')
    const admin = res.data[0]
    const token = generateToken({ openid: admin._id, role: 'admin', isAdmin: true })
    return ok({ token, userInfo: { username: admin.username, role: 'admin' } })
  },

  'GET /api/goods': async (req) => {
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 20, category, keyword, status = 'on_sale' } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const conditions = {}
    if (status) conditions.status = status
    if (category && category !== '全部') conditions.category = category
    if (keyword) conditions.title = db.RegExp({ regexp: keyword, options: 'i' })
    const [listRes, countRes] = await Promise.all([
      db.collection('goods').where(conditions).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get(),
      db.collection('goods').where(conditions).count(),
    ])
    return ok({ list: listRes.data || [], total: countRes.total || 0, page: Number(page), pageSize: Number(pageSize) })
  },

  'GET /api/goods/detail': async (req) => {
    const { id } = url.parse(req.url, true).query
    if (!id) return err(400, '缺少商品ID')
    const res = await db.collection('goods').doc(id).get()
    if (!res.data) return err(404, '商品不存在')
    await db.collection('goods').doc(id).update({ viewCount: dbCmd.inc(1) })
    return ok(res.data)
  },

  'POST /api/goods/publish': async (req, body) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const { title, description, condition, category, price, originalPrice, location, contactWechat, contactPhone, images } = body
    if (!title || !price || !condition) return err(400, '请填写必填项')
    const goods = { title, description, condition, category: category || '其他', price: Number(price), originalPrice: originalPrice ? Number(originalPrice) : null, location, contactWechat, contactPhone, images: images || [], status: 'on_sale', publisherId: user.openid, viewCount: 0, createdAt: new Date(), updatedAt: new Date() }
    const res = await db.collection('goods').add(goods)
    return ok({ _id: res.id, ...goods })
  },

  'POST /api/goods/sell': async (req, body) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const { id } = body
    const res = await db.collection('goods').doc(id).get()
    if (!res.data) return err(404, '商品不存在')
    if (res.data.publisherId !== user.openid && !user.isAdmin) return err(403, '无权操作')
    await db.collection('goods').doc(id).update({ status: 'sold', soldAt: new Date(), updatedAt: new Date() })
    return ok(null, '已标记为已卖出')
  },

  'POST /api/goods/delete': async (req, body) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const { id } = body
    const res = await db.collection('goods').doc(id).get()
    if (!res.data) return err(404, '商品不存在')
    if (res.data.publisherId !== user.openid && !user.isAdmin) return err(403, '无权操作')
    await db.collection('goods').doc(id).update({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
    return ok(null, '已删除')
  },

  'POST /api/favorites/toggle': async (req, body) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const { goodsId } = body
    const res = await db.collection('favorites').where({ goodsId, userId: user.openid }).get()
    if (res.data?.length > 0) {
      await db.collection('favorites').doc(res.data[0]._id).remove()
      return ok({ favorited: false })
    }
    await db.collection('favorites').add({ goodsId, userId: user.openid, createdAt: new Date() })
    return ok({ favorited: true })
  },

  'GET /api/favorites': async (req) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 20 } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const favRes = await db.collection('favorites').where({ userId: user.openid }).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get()
    const favList = favRes.data || []
    if (!favList.length) return ok({ list: [], total: 0 })
    const goodsIds = favList.map(f => f.goodsId)
    const goodsRes = await db.collection('goods').where({ _id: dbCmd.in(goodsIds) }).get()
    const goodsMap = new Map((goodsRes.data || []).map(g => [g._id, g]))
    const list = favList.map(f => { const g = goodsMap.get(f.goodsId); return g ? { ...g, _favId: f._id, _favAt: f.createdAt } : null }).filter(Boolean)
    return ok({ list, total: favList.length })
  },

  'GET /api/locations': async () => {
    const res = await db.collection('locations').orderBy('sort', 'asc').limit(100).get()
    return ok({ list: res.data || [] })
  },

  'GET /api/groupbuys': async (req) => {
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 20, status } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const conditions = {}
    if (status) conditions.status = status
    const [listRes, countRes] = await Promise.all([
      db.collection('groupbuys').where(conditions).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get(),
      db.collection('groupbuys').where(conditions).count(),
    ])
    return ok({ list: listRes.data || [], total: countRes.total || 0 })
  },

  'POST /api/groupbuys/join': async (req, body) => {
    const user = getUser(req)
    if (!user) return err(401, '请先登录')
    const { id } = body
    const res = await db.collection('groupbuys').doc(id).get()
    const gb = res.data
    if (!gb) return err(404, '拼团不存在')
    if (gb.status !== 'pending') return err(400, '拼团已结束')
    if (gb.participants?.includes(user.openid)) return err(400, '已参团')
    const newCount = (gb.currentCount || 0) + 1
    const newStatus = newCount >= gb.targetCount ? 'successful' : 'pending'
    await db.collection('groupbuys').doc(id).update({ currentCount: newCount, participants: dbCmd.push(user.openid), status: newStatus, updatedAt: new Date() })
    return ok({ currentCount: newCount, status: newStatus })
  },

  'GET /api/announcements': async () => {
    const res = await db.collection('announcements').orderBy('createdAt', 'desc').limit(50).get()
    return ok({ list: res.data || [] })
  },

  // -- 管理端 --
  'GET /admin/dashboard': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const [goods, users, groupbuys, soldToday] = await Promise.all([
      db.collection('goods').where({ status: 'on_sale' }).count(),
      db.collection('users').count(),
      db.collection('groupbuys').where({ status: 'pending' }).count(),
      db.collection('goods').where({ status: 'sold', soldAt: dbCmd.gte(new Date(new Date().setHours(0, 0, 0, 0))) }).count(),
    ])
    const recentGoods = await db.collection('goods').orderBy('createdAt', 'desc').limit(5).get()
    return ok({ stats: { goodsOnSale: goods.total, users: users.total, groupbuys: groupbuys.total, todaySold: soldToday.total }, recentGoods: recentGoods.data || [] })
  },

  'GET /admin/goods': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 20, status, keyword } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const conditions = {}
    if (status) conditions.status = status
    if (keyword) conditions.title = db.RegExp({ regexp: keyword, options: 'i' })
    const [listRes, countRes] = await Promise.all([
      db.collection('goods').where(conditions).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get(),
      db.collection('goods').where(conditions).count(),
    ])
    return ok({ list: listRes.data || [], total: countRes.total || 0 })
  },

  'PUT /admin/goods/status': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, status } = body
    await db.collection('goods').doc(id).update({ status, updatedAt: new Date() })
    await db.collection('admin_logs').add({ adminId: user.openid, module: 'goods', action: `商品状态→${status}`, targetId: id, createdAt: new Date() })
    return ok(null, '操作成功')
  },

  'GET /admin/users': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 20, keyword } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const conditions = {}
    if (keyword) conditions.nickname = db.RegExp({ regexp: keyword, options: 'i' })
    const [listRes, countRes] = await Promise.all([
      db.collection('users').where(conditions).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get(),
      db.collection('users').where(conditions).count(),
    ])
    return ok({ list: listRes.data || [], total: countRes.total || 0 })
  },

  'PUT /admin/users/role': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, role } = body
    await db.collection('users').doc(id).update({ role })
    await db.collection('admin_logs').add({ adminId: user.openid, module: 'user', action: `角色→${role}`, targetId: id, createdAt: new Date() })
    return ok(null, '操作成功')
  },

  'PUT /admin/users/disable': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, disabled } = body
    await db.collection('users').doc(id).update({ disabled })
    await db.collection('admin_logs').add({ adminId: user.openid, module: 'user', action: disabled ? '禁用' : '解禁', targetId: id, createdAt: new Date() })
    return ok(null, '操作成功')
  },

  'GET /admin/announcements': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const res = await db.collection('announcements').orderBy('createdAt', 'desc').limit(100).get()
    return ok({ list: res.data || [] })
  },

  'POST /admin/announcements': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { title, type, content } = body
    if (!title || !content) return err(400, '请填写完整')
    const res = await db.collection('announcements').add({ title, type: type || 'notice', content, pinned: false, author: '管理员', readCount: 0, createdAt: new Date(), updatedAt: new Date() })
    await db.collection('admin_logs').add({ adminId: user.openid, module: 'announce', action: '发布公告', detail: title, createdAt: new Date() })
    return ok({ _id: res.id })
  },

  'PUT /admin/announcements': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, title, type, content } = body
    await db.collection('announcements').doc(id).update({ ...(title && { title }), ...(type && { type }), ...(content && { content }), updatedAt: new Date() })
    return ok(null, '更新成功')
  },

  'DELETE /admin/announcements': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id } = body
    await db.collection('announcements').doc(id).remove()
    return ok(null, '删除成功')
  },

  'PUT /admin/announcements/pin': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, pinned } = body
    await db.collection('announcements').doc(id).update({ pinned })
    return ok(null, pinned ? '已置顶' : '已取消')
  },

  'GET /admin/locations': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const res = await db.collection('locations').orderBy('sort', 'asc').limit(100).get()
    return ok({ list: res.data || [] })
  },

  'POST /admin/locations': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { name, sort } = body
    if (!name) return err(400, '请输入地址')
    const res = await db.collection('locations').add({ name, sort: sort || 0, createdAt: new Date() })
    return ok({ _id: res.id })
  },

  'PUT /admin/locations': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id, name, sort } = body
    await db.collection('locations').doc(id).update({ ...(name && { name }), ...(sort !== undefined && { sort }), updatedAt: new Date() })
    return ok(null, '更新成功')
  },

  'DELETE /admin/locations': async (req, body) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const { id } = body
    await db.collection('locations').doc(id).remove()
    return ok(null, '删除成功')
  },

  'GET /admin/logs': async (req) => {
    const user = getUser(req)
    if (!user?.isAdmin) return err(403, '需要管理员权限')
    const params = url.parse(req.url, true).query
    const { page = 1, pageSize = 30, module } = params
    const skip = (Number(page) - 1) * Number(pageSize)
    const conditions = {}
    if (module) conditions.module = module
    const [listRes, countRes] = await Promise.all([
      db.collection('admin_logs').where(conditions).orderBy('createdAt', 'desc').skip(skip).limit(Number(pageSize)).get(),
      db.collection('admin_logs').where(conditions).count(),
    ])
    return ok({ list: listRes.data || [], total: countRes.total || 0 })
  },
}

// ============ HTTP 服务 ============
const PORT = process.env.PORT || 9000

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  // 健康检查
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200)
    return res.end(JSON.stringify({ name: 'Hi-Neighbor API', version: '1.0.0', status: 'running' }))
  }

  try {
    const parsed = url.parse(req.url, true)
    const method = req.method
    const pathname = parsed.pathname.replace(/\/$/, '')

    // 匹配带路径参数的路由 /api/goods/:id → 需要特殊处理
    let routeKey = `${method} ${pathname}`

    // 动态路由匹配
    let handler = handlers[routeKey]
    let pathParams = {}

    if (!handler) {
      // /api/goods/xxx → /api/goods/detail?id=xxx (兼容)
      const goodsMatch = pathname.match(/^\/api\/goods\/([^/]+)$/)
      if (goodsMatch && method === 'GET') {
        pathParams = { id: goodsMatch[1] }
        handler = handlers['GET /api/goods/detail']
        parsed.query.id = parsed.query.id || goodsMatch[1]
      }
    }

    if (!handler) {
      res.writeHead(404)
      return res.end(JSON.stringify(err(404, `接口不存在: ${routeKey}`)))
    }

    let body = {}
    if (method !== 'GET' && method !== 'DELETE' || method === 'DELETE') {
      body = await parseBody(req)
    }
    if (method === 'DELETE' && !Object.keys(body).length) {
      // DELETE 可能带 query params
      body = parsed.query
    }

    // 路径参数注入 query
    Object.assign(parsed.query, pathParams)
    req.url = url.format({ pathname: parsed.pathname, query: parsed.query })

    const result = await handler(req, body)
    res.writeHead(result.code === 0 ? 200 : result.code || 200)
    res.end(JSON.stringify(result))
  } catch (e) {
    console.error('Server error:', e)
    res.writeHead(500)
    res.end(JSON.stringify(err(500, e.message)))
  }
})

server.listen(PORT, () => {
  console.log(`Hi-Neighbor API running on port ${PORT}`)
})
