<template>
  <view class="page">
    <view class="header">
      <text class="header-title">社区公告</text>
      <text class="header-badge" v-if="announces.length">{{ announces.length }} 条</text>
    </view>

    <scroll-view scroll-y class="list">
      <view v-for="item in announces" :key="item._id" class="ann-card" @tap="showDetail(item)">
        <view class="card-top">
          <text class="ann-tag" :class="item.type">{{ typeText(item.type) }}</text>
          <text class="ann-date">{{ formatDate(item.createdAt) }}</text>
        </view>
        <text class="ann-title">{{ item.title }}</text>
        <text class="ann-body">{{ item.content }}</text>
        <view class="card-footer">
          <text class="ann-author">{{ item.author }}</text>
          <text class="ann-read">{{ item.readCount || 0 }}人已读</text>
        </view>
      </view>

      <view class="load-tip" v-if="!announces.length">
        <text>暂无公告</text>
      </view>
    </scroll-view>

    <!-- 详情弹窗 -->
    <view class="detail-mask" v-if="detailVisible" @tap="detailVisible = false">
      <view class="detail-panel" @tap.stop>
        <view class="detail-top">
          <text class="ann-tag" :class="detail.type">{{ typeText(detail.type) }}</text>
          <text class="ann-date">{{ formatDate(detail.createdAt) }}</text>
        </view>
        <text class="detail-title">{{ detail.title }}</text>
        <text class="detail-content">{{ detail.content }}</text>
        <view class="detail-footer">
          <text class="ann-author">{{ detail.author }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { announceApi } from '../../api'

const announces = ref<any[]>([])
const detailVisible = ref(false)
const detail = ref<any>({})

function typeText(t: string) {
  const map: Record<string, string> = { urgent: '重要通知', event: '社区活动', notice: '温馨提示' }
  return map[t] || '通知'
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function showDetail(item: any) {
  detail.value = item
  detailVisible.value = true
}

async function fetchList() {
  try {
    const data = await announceApi.getList()
    announces.value = data.list || data || []
  } catch {}
}

onMounted(() => fetchList())
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $accent-light: #fdf5ee;
$radius: 16rpx;

.page { min-height: 100vh; background: $bg; overflow-x: hidden; }
.header { display: flex; justify-content: space-between; align-items: center;
  padding: 28rpx 24rpx; border-bottom: 2rpx solid $border; }
.header-title { font-size: 36rpx; font-weight: 700; }
.header-badge { font-size: 22rpx; color: $text-tri; }
.list { padding: 20rpx 24rpx; box-sizing: border-box; }

.ann-card { padding: 28rpx; border-radius: $radius; border: 2rpx solid $border; margin-bottom: 20rpx; box-sizing: border-box; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.ann-tag { font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 6rpx; font-weight: 600;
  &.urgent { background: #fde8e8; color: #c0392b; }
  &.event { background: $accent-light; color: $accent; }
  &.notice { background: #e8f0f8; color: #2c5f8a; }
}
.ann-date { font-size: 22rpx; color: $text-tri; }
.ann-title { font-size: 30rpx; font-weight: 600; color: $text; margin-bottom: 8rpx; line-height: 1.4; display: block; }
.ann-body { font-size: 26rpx; color: $text-sec; line-height: 1.6; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { display: flex; justify-content: space-between; align-items: center;
  margin-top: 16rpx; padding-top: 16rpx; border-top: 2rpx solid $surface; }
.ann-author { font-size: 24rpx; color: $text-tri; }
.ann-read { font-size: 24rpx; color: $text-sec; font-weight: 500; }
.load-tip { text-align: center; padding: 60rpx; font-size: 28rpx; color: $text-tri; }

.detail-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; }
.detail-panel { width: 80%; max-height: 70vh; background: $bg; border-radius: 24rpx; padding: 36rpx; overflow-y: auto; }
.detail-top { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
.detail-title { font-size: 34rpx; font-weight: 600; line-height: 1.5; margin-bottom: 16rpx; display: block; }
.detail-content { font-size: 28rpx; color: $text-sec; line-height: 1.8; }
.detail-footer { margin-top: 24rpx; padding-top: 16rpx; border-top: 2rpx solid $surface; }
</style>
