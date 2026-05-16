<template>
  <view class="page">
    <view class="form-section">
      <!-- 反馈内容 -->
      <view class="form-group">
        <view class="label-row">
          <text class="form-label">反馈内容</text>
          <text class="char-count">{{ form.content.length }}/500</text>
        </view>
        <textarea
          v-model="form.content"
          class="form-textarea"
          placeholder="请描述您的问题或建议..."
          maxlength="500"
          :auto-height="false"
        />
      </view>

      <!-- 联系方式 -->
      <view class="form-group">
        <text class="form-label">联系方式（选填）</text>
        <input
          v-model="form.contact"
          class="form-input"
          placeholder="手机号/微信号/QQ"
          maxlength="50"
        />
      </view>

      <!-- 图片 -->
      <view class="form-group">
        <text class="form-label">图片（选填，最多3张）</text>
        <view class="image-list">
          <view v-for="(img, idx) in form.images" :key="idx" class="image-item">
            <image :src="img" mode="aspectFill" class="preview-img" />
            <view class="remove-btn" @tap="removeImage(idx)">
              <text>×</text>
            </view>
          </view>
          <view v-if="form.images.length < 3" class="image-add" @tap="chooseImage">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" :class="{ disabled: submitting }" @tap="handleSubmit">
      <text>{{ submitting ? '提交中...' : '提交反馈' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { feedbackApi } from '../../api'
import { http } from '../../utils/request'

const form = ref({
  content: '',
  contact: '',
  images: [] as string[],
})
const submitting = ref(false)

function chooseImage() {
  const remaining = 3 - form.value.images.length
  if (remaining <= 0) return

  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      for (const filePath of res.tempFilePaths) {
        try {
          const data = await http.uploadFile(filePath)
          form.value.images.push(data.url)
        } catch {
          uni.showToast({ title: '图片上传失败', icon: 'none' })
        }
      }
    },
  })
}

function removeImage(idx: number) {
  form.value.images.splice(idx, 1)
}

async function handleSubmit() {
  if (submitting.value) return

  if (!form.value.content.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }

  if (form.value.content.length > 500) {
    uni.showToast({ title: '反馈内容不能超过500字', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await feedbackApi.create({
      content: form.value.content.trim(),
      contact: form.value.contact.trim(),
      images: form.value.images,
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
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

.label-row { display: flex; justify-content: space-between; align-items: center; }
.char-count { font-size: 24rpx; color: $text-tri; }

.form-input { width: 100%; font-size: 30rpx; color: $text; padding: 16rpx 0; border: none; outline: none;
  background: transparent; }
.form-textarea {
  width: 100%; height: 240rpx; font-size: 30rpx; color: $text; padding: 16rpx 0;
  border: none; outline: none; background: transparent; box-sizing: border-box;
}

/* 图片上传 */
.image-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 12rpx; }
.image-item { width: 160rpx; height: 160rpx; border-radius: 12rpx; position: relative; overflow: visible; }
.preview-img { width: 100%; height: 100%; border-radius: 12rpx; }
.remove-btn {
  position: absolute; top: -12rpx; right: -12rpx;
  width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.6); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 28rpx; line-height: 1; }
}
.image-add {
  width: 160rpx; height: 160rpx; border-radius: 12rpx; border: 2rpx dashed $border;
  display: flex; align-items: center; justify-content: center; background: $surface;
}
.add-icon { font-size: 56rpx; color: $text-tri; font-weight: 300; }

.submit-btn { margin-top: 48rpx; height: 96rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 32rpx; font-weight: 600; }
  &.disabled { opacity: 0.6; } }
</style>
