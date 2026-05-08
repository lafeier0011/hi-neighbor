const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV_ID || 'bp-insight-d8gm1oyz67190a864',
  region: process.env.CLOUDBASE_REGION || 'ap-shanghai',
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
})

const db = app.database()
const collections = ['users', 'goods', 'groupbuys', 'announcements', 'favorites', 'locations', 'admin_logs', 'admin_accounts']

async function main() {
  for (const name of collections) {
    try {
      const res = await db.collection(name).limit(1).get()
      console.log(`✓ ${name} - exists (${res.data?.length || 0} docs)`)
    } catch (e) {
      console.log(`✗ ${name} - ${e.message || e}`)
    }
  }
}

main().catch(console.error)
