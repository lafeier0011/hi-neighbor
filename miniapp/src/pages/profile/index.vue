<template>
  <view class="page">
    <!-- 头部 -->
    <view class="profile-header">
      <view class="profile-top">
        <view class="avatar">
          <image v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar-img" mode="aspectFill" />
        </view>
        <view class="info">
          <text class="name">{{ userInfo.nickname || '微信用户' }}</text>
          <text class="loc">{{ userInfo.community || '' }}</text>
        </view>
      </view>
    </view>

    <!-- 统计 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ myStats.published }}</text>
        <text class="stat-label">发布</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ myStats.favorites }}</text>
        <text class="stat-label">收藏</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ myStats.groupbuy }}</text>
        <text class="stat-label">参团</text>
      </view>
    </view>

    <!-- 未登录提示 -->
    <view class="login-prompt" v-if="!isLoggedIn">
      <text class="login-text">授权微信登录，解锁更多功能</text>
      <view class="login-btn" @tap="handleLogin">
        <text>微信登录</text>
      </view>
    </view>

    <!-- 菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @tap="goMy('published')">
          <view class="menu-dot" />
          <text class="menu-text">我的发布</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goMy('favorites')">
          <view class="menu-dot" />
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goMy('groupbuy')">
          <view class="menu-dot" />
          <text class="menu-text">我的拼团</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goSetting('address')">
          <view class="menu-dot light" />
          <text class="menu-text">收货地址</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goSetting('feedback')">
          <view class="menu-dot light" />
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goSetting('about')">
          <view class="menu-dot light" />
          <text class="menu-text">关于邻趣集市</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const myStats = ref({ published: 0, favorites: 0, groupbuy: 0 })

const isLoggedIn = computed(() => userStore.isLoggedIn())
const userInfo = computed(() => userStore.userInfo || {})

async function handleLogin() {
  try {
    await userStore.login()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch {}
}

function goMy(type: string) {
  if (!isLoggedIn.value) { handleLogin(); return }
  // TODO: 跳转对应页面
  uni.showToast({ title: '开发中', icon: 'none' })
}

function goSetting(type: string) {
  if (type === 'about') {
    uni.showModal({ title: '邻趣集市', content: 'v1.0.0\n社区二手交易 + 拼团服务', showCancel: false })
  } else {
    uni.showToast({ title: '开发中', icon: 'none' })
  }
}

onMounted(() => {
  // TODO: 获取统计数据
})
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; overflow-x: hidden; }

.profile-header { background: $text; padding: 48rpx 32rpx 64rpx; }
.profile-top { display: flex; align-items: center; gap: 24rpx; }
.avatar { width: 112rpx; height: 112rpx; border-radius: 50%; background: $surface;
  border: 4rpx solid rgba(255,255,255,0.15); overflow: hidden; }
.avatar-img { width: 100%; height: 100%; }
.info { display: flex; flex-direction: column; }
.name { color: #fff; font-size: 36rpx; font-weight: 600; }
.loc { color: rgba(255,255,255,0.5); font-size: 24rpx; margin-top: 4rpx; }

.stats-bar { display: flex; margin: -32rpx 32rpx 0; background: $bg; border-radius: $radius;
  border: 2rpx solid $border; }
.stat-item { flex: 1; text-align: center; padding: 24rpx 0;
  & + .stat-item { border-left: 2rpx solid $border; }
}
.stat-num { font-size: 40rpx; font-weight: 700; color: $text; display: block; }
.stat-label { font-size: 22rpx; color: $text-tri; margin-top: 4rpx; display: block; }

.login-prompt { margin: 32rpx; padding: 32rpx; background: $bg; border-radius: $radius;
  border: 2rpx solid $border; text-align: center; }
.login-text { font-size: 28rpx; color: $text-sec; display: block; margin-bottom: 20rpx; }
.login-btn { display: inline-flex; padding: 16rpx 64rpx; background: $accent; border-radius: $radius;
  text { color: #fff; font-size: 28rpx; font-weight: 600; } }

.menu-section { padding: 24rpx 32rpx; }
.menu-group { background: $bg; border-radius: $radius; overflow: hidden; margin-bottom: 20rpx;
  border: 2rpx solid $border; }
.menu-item { display: flex; align-items: center; padding: 28rpx 32rpx;
  border-bottom: 2rpx solid $surface;
  &:last-child { border-bottom: none; }
}
.menu-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: $accent; margin-right: 24rpx; flex-shrink: 0;
  &.light { background: $text-tri; } }
.menu-text { flex: 1; font-size: 28rpx; color: $text; }
.menu-arrow { color: $text-tri; font-size: 28rpx; }
</style>
