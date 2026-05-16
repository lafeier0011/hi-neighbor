<template>
  <view class="page">
    <!-- 空状态 -->
    <view v-if="!loading && list.length === 0" class="empty">
      <text class="empty-text">暂无反馈记录</text>
      <text class="empty-hint">点击下方按钮提交反馈</text>
    </view>

    <!-- 反馈列表 -->
    <view class="feedback-list">
      <view v-for="item in list" :key="item._id" class="feedback-card">
        <view class="card-header">
          <view class="status-tag" :class="item.status">
            <text>{{ item.status === 'pending' ? '待回复' : '已回复' }}</text>
          </view>
          <text class="card-time">{{ formatTime(item.createdAt) }}</text>
        </view>
        <text class="card-content">{{ item.content }}</text>

        <!-- 图片 -->
        <view v-if="item.images?.length" class="card-images">
          <image
            v-for="(img, idx) in item.images"
            :key="idx"
            :src="img"
            mode="aspectFill"
            class="card-img"
            @tap="previewImage(img, item.images)"
          />
        </view>

        <!-- 管理员回复 -->
        <view v-if="item.reply" class="reply-section">
          <text class="reply-label">回复：</text>
          <text class="reply-content">{{ item.reply }}</text>
        </view>
      </view>
    </view>

    <!-- 加载提示 -->
    <view class="load-tip">
      <text v-if="loading">加载中...</text>
      <text v-else-if="noMore && list.length > 0">没有更多了</text>
    </view>

    <!-- 底部留白 -->
    <view style="height: 140rpx;" />

    <!-- 浮动按钮 -->
    <view class="fab" @tap="goCreate">
      <text class="fab-icon">+</text>
      <text class="fab-text">提交反馈</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import { feedbackApi } from '../../api'

const list = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const noMore = ref(false)

async function fetchList(reset = false) {
  if (loading.value) return
  if (!reset && noMore.value) return

  loading.value = true
  if (reset) {
    page.value = 1
    noMore.value = false
  }

  try {
    const data = await feedbackApi.getMine({ page: page.value, pageSize: 20 })
    const items = data.list || []
    list.value = reset ? items : [...list.value, ...items]
    if (items.length < 20) noMore.value = true
    else page.value++
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${min}`
}

function previewImage(current: string, urls: string[]) {
  uni.previewImage({ current, urls })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/feedback/create' })
}

onMounted(() => fetchList(true))
onShow(() => fetchList(true))
onReachBottom(() => fetchList())
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $accent-light: #fdf5ee;
$success: #3a7d5c; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; padding: 24rpx; box-sizing: border-box; overflow-x: hidden; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-text { font-size: 30rpx; color: $text-sec; display: block; margin-bottom: 12rpx; }
.empty-hint { font-size: 26rpx; color: $text-tri; }

.feedback-list { display: flex; flex-direction: column; gap: 20rpx; }

.feedback-card {
  background: $bg; border-radius: $radius; border: 2rpx solid $border;
  padding: 28rpx 32rpx;
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.status-tag {
  padding: 4rpx 16rpx; border-radius: 6rpx;
  text { font-size: 22rpx; font-weight: 600; }
  &.pending { background: $accent-light; text { color: $accent; } }
  &.replied { background: #e8f5ee; text { color: $success; } }
}
.card-time { font-size: 24rpx; color: $text-tri; }

.card-content { font-size: 28rpx; color: $text; line-height: 1.6; display: block; margin-bottom: 16rpx; }

.card-images { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.card-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; background: $surface; }

.reply-section { background: $surface; border-radius: 12rpx; padding: 20rpx 24rpx; }
.reply-label { font-size: 24rpx; color: $accent; font-weight: 600; display: block; margin-bottom: 8rpx; }
.reply-content { font-size: 26rpx; color: $text-sec; line-height: 1.6; }

.load-tip { text-align: center; padding: 24rpx; font-size: 24rpx; color: $text-tri; }

/* 浮动按钮 */
.fab {
  position: fixed; right: 32rpx; bottom: 80rpx;
  background: $accent; border-radius: 48rpx; padding: 20rpx 32rpx;
  display: flex; align-items: center; gap: 8rpx;
  box-shadow: 0 8rpx 24rpx rgba(194, 112, 62, 0.3); z-index: 10;
}
.fab-icon { font-size: 36rpx; color: #fff; font-weight: 300; }
.fab-text { font-size: 26rpx; color: #fff; font-weight: 600; }
</style>
