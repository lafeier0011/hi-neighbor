import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { initCollections } from './utils/cloudbase'
import { checkExpiredGroupbuys } from './utils/groupbuy-cron'
import authRoutes from './routes/auth'
import goodsRoutes from './routes/goods'
import favoritesRoutes from './routes/favorites'
import locationRoutes from './routes/location'
import groupbuyRoutes from './routes/groupbuy'
import announceRoutes from './routes/announce'
import adminRoutes from './routes/admin'
import uploadRoutes from './routes/upload'
import addressRoutes from './routes/address'
import feedbackRoutes from './routes/feedback'

const app = new Hono()

// 全局中间件
app.use('*', cors())
app.use('*', logger())

// 静态文件服务：uploads 目录
app.use('/uploads/*', serveStatic({ root: './' }))

// 健康检查
app.get('/', (c) => c.json({
  name: 'Hi-Neighbor API',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
}))

// 路由挂载
app.route('/api/auth', authRoutes)
app.route('/api/goods', goodsRoutes)
app.route('/api/favorites', favoritesRoutes)
app.route('/api/locations', locationRoutes)
app.route('/api/groupbuys', groupbuyRoutes)
app.route('/api/announcements', announceRoutes)
app.route('/api/upload', uploadRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/feedback', feedbackRoutes)
app.route('/admin', adminRoutes)

// 404
app.notFound((c) => c.json({ code: 404, message: '接口不存在' }, 404))

// 错误处理
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ code: 500, message: '服务器内部错误' }, 500)
})

// 启动
const port = Number(process.env.PORT) || 3000

console.log(`🚀 Hi-Neighbor API Server`)
console.log(`   Port: ${port}`)
console.log(`   Env: ${process.env.CLOUDBASE_ENV_ID || 'not set'}`)

// 启动时检查一次过期拼团
checkExpiredGroupbuys().catch(e => console.error('Startup groupbuy check failed:', e))

// 每分钟定时检查过期拼团
setInterval(() => {
  checkExpiredGroupbuys().catch(e => console.error('Cron groupbuy check failed:', e))
}, 60 * 1000)

// 启动 HTTP 服务
serve({ fetch: app.fetch, port })
console.log(`   ✅ Server running at http://localhost:${port}`)
