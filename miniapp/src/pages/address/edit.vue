<template>
  <view class="page">
    <view class="form-section">
      <!-- 收件人 -->
      <view class="form-group">
        <text class="form-label">收件人</text>
        <input
          v-model="form.receiverName"
          class="form-input"
          placeholder="请输入收件人姓名"
          maxlength="20"
        />
      </view>

      <!-- 手机号 -->
      <view class="form-group">
        <text class="form-label">手机号</text>
        <input
          v-model="form.phone"
          class="form-input"
          placeholder="请输入手机号"
          type="number"
          maxlength="11"
        />
      </view>

      <!-- 详细地址 -->
      <view class="form-group">
        <text class="form-label">详细地址</text>
        <textarea
          v-model="form.detail"
          class="form-textarea"
          placeholder="请输入详细地址（省/市/区/街道/门牌号）"
          maxlength="200"
          :auto-height="false"
        />
      </view>

      <!-- 设为默认 -->
      <view class="form-group switch-group">
        <text class="form-label">设为默认地址</text>
        <switch
          :checked="form.isDefault"
          @change="form.isDefault = $event.detail.value"
          color="#c2703e"
        />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-btn" :class="{ disabled: saving }" @tap="handleSave">
      <text>{{ saving ? '保存中...' : '保存' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addressApi } from '../../api'

const form = ref({
  receiverName: '',
  phone: '',
  detail: '',
  isDefault: false,
})
const saving = ref(false)
const editId = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const id = currentPage?.options?.id || ''
  editId.value = id

  if (id) {
    // 编辑模式，设置标题
    uni.setNavigationBarTitle({ title: '编辑地址' })
  }
})

async function handleSave() {
  if (saving.value) return

  const { receiverName, phone, detail } = form.value
  if (!receiverName.trim()) {
    uni.showToast({ title: '请输入收件人姓名', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!detail.trim()) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const data = {
      receiverName: receiverName.trim(),
      phone,
      detail: detail.trim(),
      isDefault: form.value.isDefault,
    }

    if (editId.value) {
      await addressApi.update(editId.value, data)
    } else {
      await addressApi.create(data)
    }

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; padding: 32rpx; overflow-x: hidden; }

.form-section { background: $bg; border-radius: $radius; border: 2rpx solid $border; overflow: hidden; }
.form-group { padding: 28rpx 32rpx; border-bottom: 2rpx solid $surface;
  &:last-child { border-bottom: none; } }
.form-label { font-size: 26rpx; color: $text-tri; display: block; margin-bottom: 12rpx; }
.form-input { width: 100%; font-size: 30rpx; color: $text; padding: 16rpx 0; border: none; outline: none;
  background: transparent; }
.form-textarea {
  width: 100%; height: 160rpx; font-size: 30rpx; color: $text; padding: 16rpx 0;
  border: none; outline: none; background: transparent; box-sizing: border-box;
}

.switch-group { display: flex; align-items: center; justify-content: space-between;
  .form-label { margin-bottom: 0; } }

.save-btn { margin-top: 48rpx; height: 96rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 32rpx; font-weight: 600; }
  &.disabled { opacity: 0.6; } }
</style>
