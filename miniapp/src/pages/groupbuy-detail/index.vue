<template>
  <view class="page">
    <!-- Nav -->
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">←</text>
      <text class="nav-title">拼团详情</text>
      <text class="nav-action" />
    </view>

    <scroll-view scroll-y class="content" v-if="detail._id">
      <!-- 图片 -->
      <swiper v-if="detail.images?.length" class="img-swiper" indicator-dots autoplay circular>
        <swiper-item v-for="(img, i) in detail.images" :key="i">
          <image :src="img" mode="aspectFill" class="swiper-img" />
        </swiper-item>
      </swiper>
      <view v-else class="img-empty" />

      <!-- 基本信息 -->
      <view class="detail-content">
        <!-- 状态标签 -->
        <view class="status-badge" :class="detail.status">
          <text>{{ statusText(detail.status) }}</text>
        </view>

        <!-- 价格对比 -->
        <view class="price-row">
          <text class="group-price">¥{{ detail.groupPrice }}</text>
          <text class="original-price">¥{{ detail.originalPrice }}</text>
          <text class="save-tag">省 ¥{{ savedAmount }}</text>
        </view>

        <text class="detail-title">{{ detail.title }}</text>

        <!-- 标签 -->
        <view class="tags">
          <text class="tag" v-if="detail.category">{{ detail.category }}</text>
          <text class="tag">目标 {{ detail.targetCount }} 人</text>
        </view>
      </view>

      <view class="section-divider" />

      <!-- 进度 -->
      <view class="detail-content">
        <text class="section-label">拼团进度</text>
        <view class="progress-wrap">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
          </view>
          <view class="progress-info">
            <text class="progress-num">{{ detail.currentCount }}/{{ detail.targetCount }}人</text>
            <text class="progress-pct">{{ progressPercent }}%</text>
          </view>
        </view>

        <!-- 参与人头像 -->
        <view class="avatar-row">
          <view v-for="i in Math.min(detail.currentCount, 8)" :key="i" class="avatar" />
          <view v-if="detail.currentCount < detail.targetCount" class="avatar empty">
            <text class="avatar-plus">+</text>
          </view>
          <text class="avatar-hint">{{ detail.currentCount >= detail.targetCount ? '已满员' : `还差${detail.targetCount - detail.currentCount}人` }}</text>
        </view>
      </view>

      <view class="section-divider" />

      <!-- 倒计时 -->
      <view class="detail-content" v-if="detail.status === 'pending'">
        <text class="section-label">剩余时间</text>
        <view class="countdown-wrap">
          <text class="countdown-text">{{ countdownText }}</text>
        </view>
      </view>

      <view class="section-divider" v-if="detail.status === 'pending'" />

      <!-- 描述 -->
      <view class="detail-content">
        <text class="section-label">详细描述</text>
        <text class="detail-desc">{{ detail.description || '暂无描述' }}</text>
      </view>

      <view class="section-divider" />

      <!-- 发起人 -->
      <view class="detail-content">
        <text class="section-label">发起人</text>
        <view class="organizer-card">
          <view class="organizer-avatar" />
          <view class="organizer-info">
            <text class="organizer-name">{{ detail.organizerInfo?.nickname || '微信用户' }}</text>
            <text class="organizer-tag">发起人</text>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="detail-content" v-if="detail.contactWechat || detail.contactPhone">
        <text class="section-label">联系方式</text>
        <view class="contact-item" v-if="detail.contactWechat">
          <view class="contact-info">
            <text class="contact-type wechat">微信</text>
            <text class="contact-value">{{ detail.contactWechat }}</text>
          </view>
          <view class="copy-btn" @tap="copy(detail.contactWechat)">
            <text>{{ copyText }}</text>
          </view>
        </view>
        <view class="contact-item" v-if="detail.contactPhone">
          <view class="contact-info">
            <text class="contact-type phone">手机</text>
            <text class="contact-value">{{ detail.contactPhone }}</text>
          </view>
          <view class="copy-btn" @tap="copy(detail.contactPhone)">
            <text>{{ copyText }}</text>
          </view>
        </view>
      </view>

      <view style="height: 160rpx;" />
    </scroll-view>

    <!-- 加载中 -->
    <view v-if="!detail._id && !loaded" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 加载失败 -->
    <view v-if="loaded && !detail._id" class="loading-wrap">
      <text class="loading-text">拼团不存在或已被删除</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="detail._id">
      <!-- 发起人视角 -->
      <template v-if="isOrganizer">
        <view class="status-text-bar" :class="detail.status">
          <text>{{ detail.status === 'pending' ? '你发起的拼团' : detail.status === 'successful' ? '已成团' : '已过期' }}</text>
        </view>
      </template>
      <!-- 非发起人视角 -->
      <template v-else>
        <template v-if="detail.status === 'pending'">
          <view v-if="detail.isJoined" class="btn-row">
            <view class="cancel-btn" @tap="leaveGroup">
              <text>取消参团</text>
            </view>
          </view>
          <view v-else class="join-action" @tap="joinGroup">
            <text>立即参团</text>
          </view>
        </template>
        <template v-else>
          <view class="status-text-bar" :class="detail.status">
            <text>{{ detail.status === 'successful' ? '已成团' : '已过期' }}</text>
          </view>
        </template>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { groupbuyApi } from '../../api'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const detail = ref<any>({})
const loaded = ref(false)
const copyText = ref('复制')
const gbId = ref('')
let countdownTimer: any = null

const isOrganizer = computed(() => detail.value.organizerId === userStore.userInfo?.openid)

const progressPercent = computed(() => {
  const cur = detail.value.currentCount || 0
  const total = detail.value.targetCount || 1
  return Math.min(100, Math.round((cur / total) * 100))
})

const savedAmount = computed(() => {
  const orig = detail.value.originalPrice || 0
  const grp = detail.value.groupPrice || 0
  return Math.max(0, orig - grp).toFixed(0)
})

function statusText(s: string) {
  const map: Record<string, string> = { pending: '进行中', successful: '已成团', expired: '已过期' }
  return map[s] || s
}

// 倒计时
const countdownText = ref('')
function updateCountdown() {
  if (!detail.value.deadline) { countdownText.value = ''; return }
  const diff = new Date(detail.value.deadline).getTime() - Date.now()
  if (diff <= 0) {
    countdownText.value = '已截止'
    return
  }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if (days > 0) {
    countdownText.value = `${days}天 ${hours}小时 ${mins}分 ${secs}秒`
  } else {
    countdownText.value = `${hours}小时 ${mins}分 ${secs}秒`
  }
}

function startCountdown() {
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
}

function goBack() { uni.navigateBack() }

async function fetchDetail() {
  if (!gbId.value) return
  try {
    const res = await groupbuyApi.getDetail(gbId.value)
    detail.value = Array.isArray(res) ? res[0] : res
    if (detail.value.status === 'pending') {
      startCountdown()
    }
  } catch {}
  loaded.value = true
}

function copy(val: string) {
  uni.setClipboardData({
    data: val,
    success: () => {
      copyText.value = '已复制'
      setTimeout(() => copyText.value = '复制', 1500)
    },
  })
}

async function joinGroup() {
  if (!userStore.isLoggedIn()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  try {
    await groupbuyApi.join(gbId.value)
    uni.showToast({ title: '参团成功', icon: 'success' })
    fetchDetail()
  } catch {}
}

async function leaveGroup() {
  uni.showModal({
    title: '确认',
    content: '确定要退出拼团吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await groupbuyApi.leave(gbId.value)
          uni.showToast({ title: '已退出', icon: 'success' })
          fetchDetail()
        } catch {}
      }
    },
  })
}

onLoad((options: any) => {
  gbId.value = options.id || ''
  fetchDetail()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $accent-light: #fdf5ee;
$success: #3a7d5c; $error: #c0392b; $radius: 16rpx;

.page { min-height: 100vh; background: $bg; display: flex; flex-direction: column; overflow-x: hidden; }
.nav-bar { height: 88rpx; display: flex; align-items: center; justify-content: space-between;
  padding: 0 32rpx; border-bottom: 2rpx solid $border; }
.nav-back { font-size: 36rpx; color: $text; }
.nav-title { font-size: 32rpx; font-weight: 600; }
.nav-action { width: 60rpx; }

.content { flex: 1; height: 0; }
.img-swiper { height: 480rpx; }
.swiper-img { width: 100%; height: 100%; }
.img-empty { width: 100%; height: 400rpx; background: $surface; }

.detail-content { padding: 28rpx 32rpx; }

.status-badge {
  display: inline-flex; padding: 8rpx 20rpx; border-radius: 8rpx; margin-bottom: 16rpx;
  text { font-size: 22rpx; font-weight: 600; }
  &.pending { background: $accent-light; text { color: $accent; } }
  &.successful { background: #e8f5ee; text { color: $success; } }
  &.expired { background: $surface; text { color: $text-tri; } }
}

.price-row { display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 16rpx; }
.group-price { font-size: 56rpx; font-weight: 700; color: $accent; }
.original-price { font-size: 28rpx; color: $text-tri; text-decoration: line-through; }
.save-tag { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; background: #fdf6e3; color: #d4a017; font-weight: 600; }

.detail-title { font-size: 34rpx; font-weight: 600; line-height: 1.5; display: block; margin-bottom: 16rpx; }
.tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 6rpx; background: $surface; color: $text-sec; }

.section-divider { height: 2rpx; background: $border; margin: 0 32rpx; }
.section-label { font-size: 24rpx; font-weight: 600; color: $text-tri; letter-spacing: 1rpx; margin-bottom: 16rpx; display: block; }

.progress-wrap { margin-bottom: 20rpx; }
.progress-bar { height: 16rpx; background: $surface; border-radius: 8rpx; overflow: hidden; margin-bottom: 12rpx; }
.progress-fill { height: 100%; background: $accent; border-radius: 8rpx; transition: width 0.3s; }
.progress-info { display: flex; justify-content: space-between; align-items: center; }
.progress-num { font-size: 28rpx; font-weight: 600; color: $text; }
.progress-pct { font-size: 26rpx; color: $accent; font-weight: 600; }

.avatar-row { display: flex; align-items: center; flex-wrap: wrap; }
.avatar { width: 56rpx; height: 56rpx; border-radius: 50%; background: $border; margin-right: -8rpx; border: 4rpx solid $bg;
  &.empty { background: $surface; border: 2rpx dashed $border; display: flex; align-items: center; justify-content: center; } }
.avatar-plus { font-size: 24rpx; color: $text-tri; }
.avatar-hint { font-size: 24rpx; color: $text-tri; margin-left: 20rpx; }

.countdown-wrap { padding: 20rpx 0; }
.countdown-text { font-size: 32rpx; font-weight: 600; color: $accent; letter-spacing: 2rpx; }

.detail-desc { font-size: 28rpx; color: $text-sec; line-height: 1.7; }

.organizer-card { display: flex; align-items: center; gap: 20rpx; padding: 20rpx; background: $surface; border-radius: $radius; border: 2rpx solid $border; }
.organizer-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: $border; }
.organizer-info { flex: 1; }
.organizer-name { font-size: 30rpx; font-weight: 600; display: block; }
.organizer-tag { font-size: 20rpx; color: $accent; font-weight: 600; margin-top: 4rpx; display: block; }

.contact-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 24rpx;
  background: $surface; border-radius: 12rpx; border: 2rpx solid $border; margin-bottom: 12rpx; }
.contact-info { display: flex; align-items: center; gap: 12rpx; }
.contact-type { font-size: 20rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 6rpx;
  &.wechat { background: $accent-light; color: $accent; }
  &.phone { background: #e8f0f8; color: #2c5f8a; }
}
.contact-value { font-size: 28rpx; color: $text; font-weight: 500; }
.copy-btn { padding: 12rpx 24rpx; background: $accent; border-radius: 12rpx;
  text { color: #fff; font-size: 24rpx; font-weight: 600; } }

.loading-wrap { flex: 1; display: flex; align-items: center; justify-content: center; }
.loading-text { font-size: 28rpx; color: $text-tri; }

.bottom-bar {
  display: flex; align-items: center; padding: 16rpx 32rpx; gap: 16rpx;
  border-top: 2rpx solid $border; background: $bg;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.join-action { flex: 1; height: 88rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 30rpx; font-weight: 600; } }
.cancel-btn { flex: 1; height: 88rpx; background: $surface; border-radius: $radius; border: 2rpx solid $border;
  display: flex; align-items: center; justify-content: center;
  text { color: $error; font-size: 30rpx; font-weight: 600; } }
.btn-row { flex: 1; display: flex; gap: 16rpx; }
.status-text-bar { flex: 1; height: 88rpx; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { font-size: 30rpx; font-weight: 600; }
  &.pending { background: $accent-light; text { color: $accent; } }
  &.successful { background: #e8f5ee; text { color: $success; } }
  &.expired { background: $surface; text { color: $text-tri; } }
}
</style>
