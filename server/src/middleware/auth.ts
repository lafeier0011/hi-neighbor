import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'hi-neighbor-jwt-secret-2026'

export interface JwtPayload {
  openid: string
  role: 'user' | 'admin'
}

// 用户认证中间件（小程序端）
export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ code: 401, message: '未登录' }, 401)
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ code: 401, message: '登录已过期' }, 401)
  }
}

// 管理员认证中间件
export async function adminMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ code: 401, message: '未登录' }, 401)
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (payload.role !== 'admin') {
      return c.json({ code: 403, message: '无权限' }, 403)
    }
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ code: 401, message: '登录已过期' }, 401)
  }
}

// 生成JWT
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 验证微信登录获取openid（简化版，实际需要调用微信API）
export async function verifyWxLogin(code: string): Promise<string> {
  // TODO: 调用微信 code2Session 接口获取 openid
  // const res = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`)
  // const data = await res.json()
  // return data.openid
  
  // 开发阶段用code作为临时openid
  return `dev_${code}`
}
