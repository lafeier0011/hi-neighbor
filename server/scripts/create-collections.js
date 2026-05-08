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
      await db.createCollection(name)
      console.log(`✓ ${name} - created`)
    } catch (e) {
      if (e.message?.includes('already exist')) {
        console.log(`✓ ${name} - already exists`)
      } else {
        console.log(`✗ ${name} - ${e.message}`)
      }
    }
  }

  try {
    await db.collection('admin_accounts').add({
      username: 'admin',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'hi-neighbor-admin-2026',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log('✓ admin account created')
  } catch (e) {
    console.log(`? admin: ${e.message}`)
  }
}

main().catch(console.error)
