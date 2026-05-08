import 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      openid: string
      role: 'user' | 'admin'
    }
  }
}
