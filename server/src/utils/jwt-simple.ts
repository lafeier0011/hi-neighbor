// 快速修复：直接用明文密码验证的管理员登录
// 放在 auth 路由下，不需要 adminMiddleware

const crypto = require('crypto')

// 简易 JWT
const JWT_SECRET = process.env.JWT_SECRET || 'hi-neighbor-jwt-secret-2026'

function generateToken(payload: any) {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
  const data = { ...payload, exp }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payloadStr = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadStr}`).digest('base64url')
  return `${header}.${payloadStr}.${sig}`
}

// 管理后台登录路由 - 不需要认证中间件
// 路径: POST /admin/login (注意: 不是 /api/auth/admin/login)
// 这里作为一个独立路由挂载，绕过 admin 的全局中间件

export { generateToken }
