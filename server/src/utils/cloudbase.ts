// CloudBase SDK 初始化
const cloudbase = require('@cloudbase/node-sdk')

let app: any = null
let db: any = null

export function getCloudBase() {
  if (!app) {
    app = cloudbase.init({
      env: process.env.CLOUDBASE_ENV_ID || 'bp-insight-d8gm1oyz67190a864',
      region: process.env.CLOUDBASE_REGION || 'ap-shanghai',
      secretId: process.env.CLOUDBASE_SECRET_ID,
      secretKey: process.env.CLOUDBASE_SECRET_KEY,
    })
  }
  return app
}

export function getDb() {
  if (!db) {
    db = getCloudBase().database()
  }
  return db
}

export function getCollection(name: string) {
  return getDb().collection(name)
}

// 初始化数据库集合（检查）
export async function initCollections() {
  const names = ['users', 'goods', 'groupbuys', 'announcements', 'favorites', 'locations', 'admin_logs', 'addresses', 'feedbacks']
  console.log(`Checking ${names.length} collections...`)
  // CloudBase 集合需要在控制台手动创建，这里只做提示
  for (const name of names) {
    try {
      await getCollection(name).limit(1).get()
    } catch {
      console.warn(`Collection "${name}" may not exist, please create it in CloudBase console`)
    }
  }
  console.log('Collections check done')
}
