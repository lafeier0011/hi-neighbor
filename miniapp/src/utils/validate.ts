// 表单校验工具

/** 标题校验：1-30字 */
export function validateTitle(val: string): string | null {
  if (!val || !val.trim()) return '请输入商品名称'
  if (val.length > 30) return '名称不能超过30字'
  return null
}

/** 价格校验：正数 */
export function validatePrice(val: any): string | null {
  if (!val || Number(val) <= 0) return '请输入有效售价'
  return null
}

/** 成色校验 */
export function validateCondition(val: string): string | null {
  if (!val) return '请选择成色'
  return null
}

/** 微信号校验（选填） */
export function validateWechat(val: string): string | null {
  if (!val) return null // 选填
  if (val.length < 6 || val.length > 20) return '微信号需要6-20位'
  if (!/^[a-zA-Z]/.test(val)) return '微信号需字母开头'
  if (!/^[a-zA-Z][a-zA-Z0-9_]{5,19}$/.test(val)) return '微信号格式不正确'
  return null
}

/** 手机号校验（选填） */
export function validatePhone(val: string): string | null {
  if (!val) return null // 选填
  if (!/^1[3-9]\d{9}$/.test(val)) return '手机号格式不正确'
  return null
}

/** 联系方式至少一个 */
export function validateContact(wechat: string, phone: string): string | null {
  if (!wechat && !phone) return '请至少填写一种联系方式'
  return null
}

/** 描述校验 */
export function validateDesc(val: string): string | null {
  if (val && val.length > 300) return '描述不能超过300字'
  return null
}
