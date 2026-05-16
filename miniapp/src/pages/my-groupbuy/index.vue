<template>
  <view class="page">
    <!-- 顶部 Tab -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 拼团列表 -->
    <scroll-view scroll-y class="list-wrap" @scrolltolower="loadMore">
      <view v-if="filteredList.length" class="gb-list">
        <view
          v-for="item in filteredList"
          :key="item._id"
          class="gb-card"
        >
          <view class="gb-top">
            <text class="gb-title">{{ item.title }}</text>
            <text class="gb-status" :class="item.status">{{ statusMap[item.status] || item.status }}</text>
          </view>
          <view class="gb-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: progressPercent(item) + '%' }" />
            </view>
            <text class="progress-text">{{ item.currentCount || 0 }} / {{ item.targetCount }}</text>
          </view>
          <view class="gb-bottom">
            <text class="gb-time">{{ formatTime(item.createdAt) }}</text>
            <text class="gb-price">¥{{ item.price }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !filteredList.length" class="empty">
        <text class="empty-text">暂无拼团记录</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="loading">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="noMore && list.length" class="loading">
        <text class="loading-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { groupbuyApi } from '../../api'

const userStore = useUserStore()

const tabs = [
  { label: '我参与的', value: 'joined' },
  { label: '全部', value: 'all' },
]

const statusMap: Record<string, string> = {
  pending: '进行中',
  successful: '已成团',
  failed: '未成团',
}

const currentTab = ref('joined')
const list = ref<any[]>([])
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const noMore = ref(false)

const filteredList = computed(() => {
  if (currentTab.value === 'all') return list.value
  // "joined" 就是全部（因为接口已经按 participants 筛选了）
  return list.value
})

async function fetchList(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    noMore.value = false
    list.value = []
  }

  loading.value = true
  try {
    const res = await groupbuyApi.getMyList({ page: page.value, pageSize })
    const newList = res.list || []
    if (reset) {
      list.value = newList
    } else {
      list.value = [...list.value, ...newList]
    }
    if (newList.length < pageSize) {
      noMore.value = true
    }
  } catch {}
  loading.value = false
}

function switchTab(val: string) {
  if (currentTab.value === val) return
  currentTab.value = val
  // 数据一样，无需重新请求
}

function loadMore() {
  if (noMore.value || loading.value) return
  page.value++
  fetchList()
}

function progressPercent(item: any) {
  const cur = item.currentCount || 0
  const total = item.targetCount || 1
  return Math.min(100, Math.round((cur / total) * 100))
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchList(true)
})
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; display: flex; flex-direction: column; overflow-x: hidden; }

.tabs { display: flex; background: $bg; border-bottom: 2rpx solid $border; }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; position: relative;
  text { font-size: 28rpx; color: $text-sec; }
  &.active text { color: $accent; font-weight: 600; }
  &.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 48rpx; height: 6rpx; background: $accent; border-radius: 3rpx; }
}

.list-wrap { flex: 1; height: 0; padding: 20rpx 32rpx; }
.gb-list {}
.gb-card { padding: 24rpx; background: $bg; border-radius: $radius; border: 2rpx solid $border; margin-bottom: 16rpx; }
.gb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.gb-title { font-size: 30rpx; font-weight: 600; color: $text; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; flex-shrink: 0; margin-left: 16rpx;
  background: $surface; color: $text-sec;
  &.pending { background: #f0f7f0; color: #3a7d5c; }
  &.successful { background: #e8f0f8; color: #2c5f8a; }
  &.failed { background: #fdf6e3; color: #d4a017; } }

.gb-progress { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.progress-bar { flex: 1; height: 12rpx; background: $surface; border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: $accent; border-radius: 6rpx; transition: width 0.3s; }
.progress-text { font-size: 22rpx; color: $text-tri; flex-shrink: 0; }

.gb-bottom { display: flex; align-items: center; justify-content: space-between; }
.gb-time { font-size: 24rpx; color: $text-tri; }
.gb-price { font-size: 28rpx; font-weight: 700; color: $accent; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-text { font-size: 28rpx; color: $text-tri; }

.loading { text-align: center; padding: 24rpx 0; }
.loading-text { font-size: 24rpx; color: $text-tri; }
</style>
