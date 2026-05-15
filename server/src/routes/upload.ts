import { Hono } from 'hono'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { authMiddleware } from '../middleware/auth'

const upload = new Hono()

const UPLOAD_DIR = join(process.cwd(), 'uploads')

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// 上传文件（需登录）
upload.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ code: 400, message: '请选择文件' }, 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ code: 400, message: '仅支持 JPG/PNG/WEBP 格式' }, 400)
    }

    if (file.size > MAX_SIZE) {
      return c.json({ code: 400, message: '文件不能超过5MB' }, 400)
    }

    const ext = extname(file.name) || '.jpg'
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(filepath, buffer)

    const url = `/uploads/${filename}`

    return c.json({
      code: 0,
      message: 'success',
      data: { url },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default upload
