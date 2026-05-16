import { Hono } from 'hono'
import { getCollection } from '../utils/cloudbase'
import { authMiddleware } from '../middleware/auth'
import type { JwtPayload } from '../middleware/auth'

const addressRoutes = new Hono()

// 所有地址接口都需要登录
addressRoutes.use('*', authMiddleware)

// 获取我的地址列表
addressRoutes.get('/', async (c) => {
  const user = c.get('user') as JwtPayload
  try {
    const res = await getCollection('addresses')
      .where({ userId: user.openid, deleted: { $ne: true } })
      .orderBy('isDefault', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    return c.json({
      code: 0,
      message: 'success',
      data: { list: res.data || [] },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 新增地址
addressRoutes.post('/', async (c) => {
  const user = c.get('user') as JwtPayload
  const body = await c.req.json()

  const { receiverName, phone, detail, isDefault } = body

  if (!receiverName || !phone || !detail) {
    return c.json({ code: 400, message: '请填写完整地址信息' }, 400)
  }

  // 手机号简单校验
  if (!/^1\d{10}$/.test(phone)) {
    return c.json({ code: 400, message: '手机号格式不正确' }, 400)
  }

  try {
    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await getCollection('addresses')
        .where({ userId: user.openid, isDefault: true, deleted: { $ne: true } })
        .update({ isDefault: false })
    }

    const addressData = {
      userId: user.openid,
      receiverName,
      phone,
      detail,
      isDefault: !!isDefault,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const addRes = await getCollection('addresses').add(addressData)

    return c.json({
      code: 0,
      message: 'success',
      data: { _id: addRes.id },
    })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 编辑地址
addressRoutes.put('/:id', async (c) => {
  const user = c.get('user') as JwtPayload
  const id = c.req.param('id')
  const body = await c.req.json()

  const { receiverName, phone, detail, isDefault } = body

  if (!receiverName || !phone || !detail) {
    return c.json({ code: 400, message: '请填写完整地址信息' }, 400)
  }

  try {
    // 检查地址归属
    const existRes = await getCollection('addresses')
      .where({ _id: id, userId: user.openid, deleted: { $ne: true } })
      .limit(1)
      .get()

    if (!existRes.data || existRes.data.length === 0) {
      return c.json({ code: 404, message: '地址不存在' }, 404)
    }

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await getCollection('addresses')
        .where({ userId: user.openid, isDefault: true, deleted: { $ne: true } })
        .update({ isDefault: false })
    }

    const updateData = {
      receiverName,
      phone,
      detail,
      isDefault: !!isDefault,
      updatedAt: new Date(),
    }

    await getCollection('addresses').doc(id).update(updateData)

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

// 删除地址（软删除）
addressRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as JwtPayload
  const id = c.req.param('id')

  try {
    // 检查地址归属
    const existRes = await getCollection('addresses')
      .where({ _id: id, userId: user.openid, deleted: { $ne: true } })
      .limit(1)
      .get()

    if (!existRes.data || existRes.data.length === 0) {
      return c.json({ code: 404, message: '地址不存在' }, 404)
    }

    await getCollection('addresses').doc(id).update({
      deleted: true,
      updatedAt: new Date(),
    })

    return c.json({ code: 0, message: 'success' })
  } catch (e: any) {
    return c.json({ code: 500, message: e.message }, 500)
  }
})

export default addressRoutes
