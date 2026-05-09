<template>
  <view class="page">
    <view class="nav-bar">
      <text class="nav-title">社区拼团</text>
    </view>

    <!-- 筛选 -->
    <scroll-view scroll-x class="filter-tabs" :show-scrollbar="false" enhanced :bounces="false">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: currentTab === tab.value }"
        @tap="currentTab = tab.value; fetchList(true)"
      >
        {{ tab.label }}
      </view>
    </scroll-view>

    <!-- 拼团列表 -->
    <scroll-view scroll-y class="list" @scrolltolower="loadMore">
      <view v-for="item in list" :key="item._id" class="group-card">
        <view class="card-header">
          <text class="card-title">{{ item.title }}</text>
          <text class="card-badge" :class="item.status">{{ statusText(item.status) }}</text>
        </view>
        <text class="card-desc">{{ item.description }}</text>

        <view class="card-price-row">
          <view class="price-wrap">
            <text class="group-price">¥{{ item.groupPrice }}</text>
            <text class="original-price">¥{{ item.originalPrice }}</text>
          </view>
          <text class="status-text">{{ item.currentCount }}/{{ item.targetCount }}人</text>
        </view>

        <!-- 进度条 -->
        <view class="progress-wrap">
          <view class="progress-label">
            <text>已报名 {{ item.currentCount }}/{{ item.targetCount }}</text>
            <text>{{ progressPercent(item) }}%</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent(item) + '%' }" />
          </view>
        </view>

        <!-- 参与人 -->
        <view class="avatar-row">
          <view v-for="i in Math.min(item.currentCount, 5)" :key="i" class="avatar" />
          <view v-if="item.currentCount < item.targetCount" class="avatar empty" />
          <text class="avatar-hint">{{ item.currentCount < item.targetCount ? '等更多邻居加入' : '已满员' }}</text>
        </view>

        <!-- 按钮 -->
        <view
          class="join-btn"
          :class="{ disabled: item.status !== 'pending' || item.participants?.includes(userStore.userInfo?.openid) }"
          @tap="joinGroup(item)"
        >
          <text>{{ joinBtnText(item) }}</text>
        </view>

        <text v-if="item.deadline" class="countdown">剩余 {{ formatDeadline(item.deadline) }}</text>
      </view>

      <view class="load-tip">
        <text v-if="loading">加载中...</text>
        <text v-else-if="noMore">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { groupbuyApi } from '../../api'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const currentTab = ref('')
const list = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const noMore = ref(false)

const tabs = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'pending' },
  { label: '即将成团', value: 'almost' },
  { label: '已完成', value: 'successful' },
]

function statusText(s: string) {
  const map: Record<string, string> = { pending: '进行中', successful: '已成团', expired: '已过期' }
  return map[s] || s
}

function progressPercent(item: any) {
  return Math.min(100, Math.round((item.currentCount / item.targetCount) * 100))
}

function joinBtnText(item: any) {
  if (item.status === 'successful') return '已结束'
  if (item.status === 'expired') return '已过期'
  if (item.participants?.includes(userStore.userInfo?.openid)) return '已参团'
  return '参团'
}

function formatDeadline(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return '已截止'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}天${hours > 24 ? '' : hours + '小时'}${mins}分钟`
}

async function fetchList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) { page.value = 1; noMore.value = false }

  try {
    const params: any = { page: page.value, pageSize: 20 }
    if (currentTab.value) params.status = currentTab.value
    const data = await groupbuyApi.getList(params)
    const items = data.list || []
    list.value = reset ? items : [...list.value, ...items]
    if (items.length < 20) noMore.value = true
    else page.value++
  } finally {
    loading.value = false
  }
}

function loadMore() { fetchList() }

async function joinGroup(item: any) {
  if (item.status !== 'pending') return
  if (!userStore.isLoggedIn()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  try {
    await groupbuyApi.join(item._id)
    uni.showToast({ title: '参团成功', icon: 'success' })
    fetchList(true)
  } catch {}
}

onMounted(() => fetchList(true))
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $accent-light: #fdf5ee;
$success: #3a7d5c; $radius: 16rpx;

.page { min-height: 100vh; background: $bg; display: flex; flex-direction: column; overflow-x: hidden; }
.nav-bar { height: 88rpx; display: flex; align-items: center; justify-content: center;
  border-bottom: 2rpx solid $border; }
.nav-title { font-size: 32rpx; font-weight: 600; }

.filter-tabs { white-space: nowrap; padding: 20rpx 24rpx 20rpx 24rpx; }
.filter-tab { display: inline-flex; padding: 12rpx 28rpx; border-radius: 40rpx;
  font-size: 26rpx; font-weight: 500; background: $surface; color: $text-sec; margin-right: 16rpx;
  &.active { background: $accent; color: #fff; }
}

.list { flex: 1; padding: 16rpx 24rpx; box-sizing: border-box; }

.group-card { padding: 28rpx; border-radius: $radius; border: 2rpx solid $border; margin-bottom: 20rpx; box-sizing: border-box; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12rpx; }
.card-title { font-size: 30rpx; font-weight: 600; color: $text; flex: 1; line-height: 1.4; }
.card-badge { font-size: 20rpx; padding: 6rpx 14rpx; border-radius: 6rpx; font-weight: 600; margin-left: 16rpx;
  &.pending { background: $accent-light; color: $accent; }
  &.successful { background: #e8f5ee; color: $success; }
  &.expired { background: $surface; color: $text-tri; }
}
.card-desc { font-size: 26rpx; color: $text-sec; margin-bottom: 20rpx; line-height: 1.5; }
.card-price-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16rpx; }
.price-wrap { display: flex; align-items: baseline; gap: 12rpx; }
.group-price { font-size: 40rpx; font-weight: 700; color: $accent; }
.original-price { font-size: 24rpx; color: $text-tri; text-decoration: line-through; }
.status-text { font-size: 24rpx; color: $text-tri; }

.progress-wrap { margin-bottom: 16rpx; }
.progress-label { display: flex; justify-content: space-between; font-size: 22rpx; color: $text-tri; margin-bottom: 8rpx; }
.progress-bar { height: 8rpx; background: $surface; border-radius: 4rpx; overflow: hidden; }
.progress-fill { height: 100%; background: $accent; border-radius: 4rpx; transition: width 0.3s; }

.avatar-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: $border; margin-right: -8rpx; border: 4rpx solid $bg;
  &.empty { background: $surface; border: 2rpx dashed $border; } }
.avatar-hint { font-size: 22rpx; color: $text-tri; margin-left: 16rpx; }

.join-btn { width: 100%; height: 80rpx; background: $accent; border-radius: $radius; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 28rpx; font-weight: 600; }
  &.disabled { background: $surface; text { color: $text-tri; } }
}
.countdown { text-align: center; font-size: 22rpx; color: $text-tri; margin-top: 12rpx; display: block; }
.load-tip { text-align: center; padding: 24rpx; font-size: 24rpx; color: $text-tri; }
</style>
