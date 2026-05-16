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

    <!-- 商品列表 -->
    <scroll-view scroll-y class="list-wrap" @scrolltolower="loadMore">
      <view v-if="list.length" class="goods-list">
        <view
          v-for="item in list"
          :key="item._id"
          class="goods-card"
          @tap="goDetail(item._id)"
        >
          <image
            v-if="item.images && item.images.length"
            :src="item.images[0]"
            class="goods-img"
            mode="aspectFill"
          />
          <view v-else class="goods-img empty" />
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-price">¥{{ item.price }}</text>
            <view class="goods-bottom">
              <text class="goods-status" :class="item.status">{{ statusMap[item.status] || item.status }}</text>
              <view class="goods-actions" @tap.stop>
                <view
                  v-if="item.status === 'on_sale'"
                  class="action-btn sell"
                  @tap.stop="handleMarkSold(item._id)"
                >
                  <text>已卖出</text>
                </view>
                <view class="action-btn del" @tap.stop="handleDelete(item._id)">
                  <text>删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !list.length" class="empty">
        <text class="empty-text">暂无商品</text>
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
import { authApi, goodsApi } from '../../api'

const tabs = [
  { label: '在售', value: 'on_sale' },
  { label: '已卖出', value: 'sold' },
  { label: '全部', value: 'all' },
]

const statusMap: Record<string, string> = {
  on_sale: '在售',
  sold: '已卖出',
}

const currentTab = ref('on_sale')
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
    const res = await authApi.getMyGoods({
      page: page.value,
      pageSize,
      status: currentTab.value,
    })
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
  fetchList(true)
}

function loadMore() {
  if (noMore.value || loading.value) return
  page.value++
  fetchList()
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

async function handleMarkSold(id: string) {
  uni.showModal({
    title: '确认',
    content: '确定标记为已卖出？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await goodsApi.markSold(id)
          uni.showToast({ title: '已标记', icon: 'success' })
          fetchList(true)
        } catch {}
      }
    },
  })
}

async function handleDelete(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await goodsApi.deleteGoods(id)
          uni.showToast({ title: '已删除', icon: 'success' })
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

.page { min-height: 100vh; background: $surface; display: flex; flex-direction: column; overflow-x: hidden; }

.tabs { display: flex; background: $bg; border-bottom: 2rpx solid $border; }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; position: relative;
  text { font-size: 28rpx; color: $text-sec; }
  &.active text { color: $accent; font-weight: 600; }
  &.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 48rpx; height: 6rpx; background: $accent; border-radius: 3rpx; }
}

.list-wrap { flex: 1; height: 0; padding: 20rpx 32rpx; }
.goods-list {}
.goods-card { display: flex; gap: 20rpx; padding: 24rpx; background: $bg; border-radius: $radius;
  border: 2rpx solid $border; margin-bottom: 16rpx; }
.goods-img { width: 180rpx; height: 180rpx; border-radius: 12rpx; background: $surface; flex-shrink: 0;
  &.empty { background: $surface; } }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
.goods-title { font-size: 28rpx; color: $text; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-price { font-size: 34rpx; font-weight: 700; color: $accent; }
.goods-bottom { display: flex; align-items: center; justify-content: space-between; }
.goods-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx;
  background: $surface; color: $text-sec;
  &.on_sale { background: #f0f7f0; color: #3a7d5c; }
  &.sold { background: #fdf6e3; color: #d4a017; } }
.goods-actions { display: flex; gap: 12rpx; }
.action-btn { padding: 8rpx 20rpx; border-radius: 8rpx;
  text { font-size: 22rpx; }
  &.sell { background: $accent;
    text { color: #fff; } }
  &.del { background: $surface; border: 2rpx solid $border;
    text { color: $text-tri; } } }

.empty { text-align: center; padding: 120rpx 0; }
.empty-text { font-size: 28rpx; color: $text-tri; }

.loading { text-align: center; padding: 24rpx 0; }
.loading-text { font-size: 24rpx; color: $text-tri; }
</style>
