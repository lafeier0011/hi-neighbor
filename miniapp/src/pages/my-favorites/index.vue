<template>
  <view class="page">
    <scroll-view scroll-y class="list-wrap" @scrolltolower="loadMore">
      <view v-if="list.length" class="fav-list">
        <view
          v-for="item in list"
          :key="item._id"
          class="fav-card"
          @tap="goDetail(item._id)"
        >
          <image
            v-if="item.images && item.images.length"
            :src="item.images[0]"
            class="fav-img"
            mode="aspectFill"
          />
          <view v-else class="fav-img empty" />
          <view class="fav-info">
            <text class="fav-title">{{ item.title }}</text>
            <text class="fav-price">¥{{ item.price }}</text>
          </view>
          <view class="unfav-btn" @tap.stop="handleUnfav(item._id)">
            <text>取消收藏</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !list.length" class="empty">
        <text class="empty-text">暂无收藏</text>
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
import { ref, onMounted } from 'vue'
import { favoritesApi } from '../../api'

const list = ref<any[]>([])
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const noMore = ref(false)

async function fetchList(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    noMore.value = false
    list.value = []
  }

  loading.value = true
  try {
    const res = await favoritesApi.getList({ page: page.value, pageSize })
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

function loadMore() {
  if (noMore.value || loading.value) return
  page.value++
  fetchList()
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

async function handleUnfav(goodsId: string) {
  uni.showModal({
    title: '确认',
    content: '确定取消收藏？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await favoritesApi.toggle(goodsId)
          uni.showToast({ title: '已取消', icon: 'success' })
          fetchList(true)
        } catch {}
      }
    },
  })
}

onMounted(() => {
  fetchList(true)
})
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; overflow-x: hidden; }

.list-wrap { height: 100vh; padding: 20rpx 32rpx; }
.fav-list {}
.fav-card { display: flex; align-items: center; gap: 20rpx; padding: 24rpx; background: $bg;
  border-radius: $radius; border: 2rpx solid $border; margin-bottom: 16rpx; }
.fav-img { width: 140rpx; height: 140rpx; border-radius: 12rpx; background: $surface; flex-shrink: 0; }
.fav-info { flex: 1; overflow: hidden; }
.fav-title { font-size: 28rpx; color: $text; font-weight: 500; display: block;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-price { font-size: 32rpx; font-weight: 700; color: $accent; display: block; margin-top: 8rpx; }
.unfav-btn { padding: 12rpx 24rpx; background: $surface; border: 2rpx solid $border; border-radius: 12rpx; flex-shrink: 0;
  text { font-size: 24rpx; color: $text-tri; } }

.empty { text-align: center; padding: 120rpx 0; }
.empty-text { font-size: 28rpx; color: $text-tri; }

.loading { text-align: center; padding: 24rpx 0; }
.loading-text { font-size: 24rpx; color: $text-tri; }
</style>
