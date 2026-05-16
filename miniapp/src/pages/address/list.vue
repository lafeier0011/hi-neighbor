<template>
  <view class="page">
    <!-- 空状态 -->
    <view v-if="!loading && list.length === 0" class="empty">
      <text class="empty-text">还没有收货地址</text>
      <text class="empty-hint">点击下方按钮添加地址</text>
    </view>

    <!-- 地址列表 -->
    <view class="address-list">
      <view
        v-for="item in list"
        :key="item._id"
        class="address-card"
        @tap="goEdit(item._id)"
        @longpress="confirmDelete(item)"
      >
        <view class="card-top">
          <text class="receiver">{{ item.receiverName }}</text>
          <text class="phone">{{ item.phone }}</text>
          <view v-if="item.isDefault" class="default-tag">
            <text>默认</text>
          </view>
        </view>
        <text class="detail">{{ item.detail }}</text>

        <!-- 操作按钮 -->
        <view class="card-actions">
          <view class="action-btn" @tap.stop="goEdit(item._id)">
            <text>编辑</text>
          </view>
          <view class="action-btn danger" @tap.stop="confirmDelete(item)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="load-tip">
      <text>加载中...</text>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-btn" @tap="goAdd">
      <text>新增收货地址</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { addressApi } from '../../api'

const list = ref<any[]>([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const data = await addressApi.getList()
    list.value = data.list || []
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/address/edit' })
}

function goEdit(id: string) {
  uni.navigateTo({ url: `/pages/address/edit?id=${id}` })
}

function confirmDelete(item: any) {
  uni.showModal({
    title: '删除地址',
    content: `确定删除 ${item.receiverName} 的地址吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await addressApi.delete(item._id)
          uni.showToast({ title: '已删除', icon: 'success' })
          fetchList()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

onMounted(() => fetchList())

// 从编辑页返回时刷新列表
onShow(() => fetchList())
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $accent-light: #fdf5ee;
$danger: #e74c3c; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; padding: 24rpx; padding-bottom: 160rpx; box-sizing: border-box; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-text { font-size: 30rpx; color: $text-sec; display: block; margin-bottom: 12rpx; }
.empty-hint { font-size: 26rpx; color: $text-tri; }

.address-list { display: flex; flex-direction: column; gap: 20rpx; }

.address-card {
  background: $bg; border-radius: $radius; border: 2rpx solid $border;
  padding: 28rpx 32rpx;
}
.card-top { display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx; }
.receiver { font-size: 32rpx; font-weight: 600; color: $text; }
.phone { font-size: 28rpx; color: $text-sec; }
.default-tag {
  background: $accent-light; border-radius: 6rpx; padding: 4rpx 12rpx;
  text { font-size: 20rpx; color: $accent; font-weight: 600; }
}
.detail { font-size: 26rpx; color: $text-sec; line-height: 1.6; display: block; margin-bottom: 16rpx; }

.card-actions { display: flex; gap: 24rpx; border-top: 2rpx solid $surface; padding-top: 16rpx; }
.action-btn {
  padding: 8rpx 24rpx; border-radius: 8rpx; background: $surface;
  text { font-size: 24rpx; color: $text-sec; }

  &.danger text { color: $danger; }
}

.load-tip { text-align: center; padding: 24rpx; font-size: 24rpx; color: $text-tri; }

.bottom-btn {
  position: fixed; left: 24rpx; right: 24rpx; bottom: 40rpx;
  height: 96rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(194, 112, 62, 0.3);
  text { color: #fff; font-size: 32rpx; font-weight: 600; }
}
</style>
