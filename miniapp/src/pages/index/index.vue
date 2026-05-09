<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="top-section">
      <view class="top-row">
        <text class="app-name">邻趣集市</text>
        <view class="location">
          <view class="location-dot" />
          <text class="location-text">{{ community }}</text>
        </view>
      </view>
      <view class="search-bar" @tap="goSearch">
        <view class="search-icon" />
        <text class="search-placeholder">搜索好物、拼团...</text>
      </view>
    </view>

    <!-- 分类 -->
    <scroll-view class="categories" scroll-x>
      <view
        v-for="cat in categories"
        :key="cat.name"
        class="cat-item"
        @tap="selectCategory(cat.name)"
      >
        <view class="cat-dot" :class="{ active: currentCategory === cat.name }">
          {{ cat.label }}
        </view>
        <text class="cat-name">{{ cat.name }}</text>
      </view>
    </scroll-view>

    <view class="divider" />

    <!-- 商品列表 -->
    <scroll-view
      scroll-y
      class="product-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="product-grid">
        <view
          v-for="item in goodsList"
          :key="item._id"
          class="product-card"
          @tap="goDetail(item._id)"
        >
          <view class="product-card-inner">
            <view class="product-img">
              <image v-if="item.images?.length" :src="item.images[0]" mode="aspectFill" class="img" />
              <view v-else class="img-placeholder" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ item.title }}</text>
              <view class="product-meta">
                <text class="product-price">¥{{ item.price }}</text>
                <text class="product-condition">{{ item.condition }}</text>
              </view>
            </view>
          </view>
        </view>
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
import { goodsApi } from '../../api'

const community = ref('幸福花园')
const currentCategory = ref('全部')
const goodsList = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

const categories = [
  { name: '全部', label: '全' },
  { name: '母婴', label: '婴' },
  { name: '玩具', label: '玩' },
  { name: '书籍', label: '书' },
  { name: '家居', label: '居' },
  { name: '拼团', label: '团' },
]

async function fetchGoods(reset = false) {
  if (loading.value) return
  if (!reset && noMore.value) return

  loading.value = true
  if (reset) {
    page.value = 1
    noMore.value = false
  }

  try {
    const params: any = { page: page.value, pageSize: 20 }
    if (currentCategory.value !== '全部') {
      params.category = currentCategory.value
    }
    const data = await goodsApi.getList(params)
    const list = data.list || []
    if (reset) {
      goodsList.value = list
    } else {
      goodsList.value = [...goodsList.value, ...list]
    }
    if (list.length < 20) noMore.value = true
    else page.value++
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function selectCategory(name: string) {
  currentCategory.value = name
  fetchGoods(true)
}

function loadMore() {
  fetchGoods()
}

function onRefresh() {
  refreshing.value = true
  fetchGoods(true)
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

function goSearch() {
  // TODO: 搜索页
}

onMounted(() => {
  fetchGoods(true)
})
</script>

<style scoped lang="scss">
$bg: #ffffff;
$surface: #f8f5f1;
$border: #ebe4da;
$text: #2d2a26;
$text-secondary: #6b6b6b;
$text-tertiary: #999;
$accent: #c2703e;
$accent-light: #fdf5ee;
$radius: 16rpx;

.page {
  min-height: 100vh;
  background: $bg;
  display: flex;
  flex-direction: column;
}

.top-section {
  padding: 20rpx 32rpx 24rpx;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.app-name {
  font-size: 40rpx;
  font-weight: 700;
  color: $text;
}

.location {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.location-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $accent;
}

.location-text {
  font-size: 24rpx;
  color: $text-tertiary;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $surface;
  border-radius: $radius;
  padding: 20rpx 28rpx;
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid $text-tertiary;
  border-radius: 50%;
}

.search-placeholder {
  font-size: 28rpx;
  color: $text-tertiary;
}

.categories {
  white-space: nowrap;
  padding: 0 32rpx 20rpx;
}

.cat-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: 36rpx;
}

.cat-dot {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 600;
  color: $text-secondary;
  background: $surface;

  &.active {
    background: $accent-light;
    color: $accent;
  }
}

.cat-name {
  font-size: 22rpx;
  color: $text-tertiary;
  margin-top: 8rpx;
}

.divider {
  height: 2rpx;
  background: $border;
}

.product-list {
  flex: 1;
  height: 0;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx 20rpx 0;
  box-sizing: border-box;
}

.product-card {
  width: 50%;
  box-sizing: border-box;
  padding: 0 10rpx;
  margin-bottom: 20rpx;
}

.product-card-inner {
  background: $bg;
  border-radius: $radius;
  border: 2rpx solid $border;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-img {
  height: 240rpx;
  background: $surface;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img {
  width: 100%;
  height: 100%;
}

.img-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius;
  background: $border;
}

.product-info {
  padding: 16rpx 20rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 26rpx;
  color: $text;
  font-weight: 500;
  lines: 2;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
  min-height: 72rpx;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 32rpx;
  font-weight: 700;
  color: $accent;
}

.product-condition {
  font-size: 20rpx;
  font-weight: 600;
  color: $accent;
  background: $accent-light;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.load-tip {
  text-align: center;
  padding: 20rpx;
  font-size: 24rpx;
  color: $text-tertiary;
}
</style>
