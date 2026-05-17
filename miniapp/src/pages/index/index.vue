<template>
  <view class="page">
    <!-- 社区切换 + 搜索 -->
    <view class="top-bar">
      <picker v-if="!searchMode" :range="communities" @change="switchCommunity">
        <view class="community-picker">
          <text class="community-name">{{ currentCommunity }}</text>
          <text class="community-arrow">▼</text>
        </view>
      </picker>
      <!-- 搜索栏：点击原地展开输入框 -->
      <view class="search-bar">
        <view class="search-icon" />
        <input
          v-if="searchMode"
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索好物..."
          focus
          confirm-type="search"
          @confirm="doSearch"
          @input="onSearchInput"
          @blur="onBlur"
        />
        <text v-else class="search-placeholder" @tap="toggleSearch">搜索好物...</text>
        <view v-if="searchMode" class="search-cancel" @tap="cancelSearch">
          <text>取消</text>
        </view>
      </view>
    </view>

    <!-- 搜索历史 -->
    <view v-if="searchMode && searchHistory.length > 0 && !hasSearched" class="history-section">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <view class="history-clear" @tap="clearHistory">
          <text>清空</text>
        </view>
      </view>
      <view class="history-tags">
        <view
          v-for="(tag, idx) in searchHistory"
          :key="idx"
          class="history-tag"
          @tap="searchByHistory(tag)"
        >
          <text>{{ tag }}</text>
        </view>
      </view>
    </view>

    <!-- 分类 -->
    <scroll-view v-if="!searchMode" class="categories" scroll-x :show-scrollbar="false" enhanced :bounces="false">
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

    <view v-if="!searchMode" class="divider" />

    <!-- 骨架屏 -->
    <view v-if="skeletonLoading" class="skeleton-grid">
      <view v-for="i in 4" :key="i" class="skeleton-card">
        <view class="skeleton-img" />
        <view class="skeleton-text" />
        <view class="skeleton-text short" />
      </view>
    </view>

    <!-- 商品列表 -->
    <view v-else class="product-grid">
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
            <!-- 搜索高亮标题 -->
            <rich-text v-if="searchKeyword.trim()" class="product-name" :nodes="highlightTitle(item.title)" />
            <text v-else class="product-name">{{ item.title }}</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onReachBottom, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { goodsApi, locationApi } from '../../api'

const currentCommunity = ref('全部社区')
const communities = ref<string[]>(['全部社区'])
const currentCategory = ref('全部')
const categories = ref([
  { name: '全部', label: '全部' },
  { name: '母婴', label: '母婴' },
  { name: '玩具', label: '玩具' },
  { name: '书籍', label: '书籍' },
  { name: '家居', label: '家居' },
  { name: '其他', label: '其他' },
])
const goodsList = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const skeletonLoading = ref(true)

// 搜索相关
const searchMode = ref(false)
const searchKeyword = ref('')
const searchHistory = ref<string[]>([])
const hasSearched = ref(false)

// 搜索历史本地存储
const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 10

function loadHistory() {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    searchHistory.value = raw ? JSON.parse(raw) : []
  } catch {
    searchHistory.value = []
  }
}

function saveHistory(keyword: string) {
  if (!keyword.trim()) return
  const list = searchHistory.value.filter(k => k !== keyword.trim())
  list.unshift(keyword.trim())
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY
  searchHistory.value = list
  uni.setStorageSync(HISTORY_KEY, JSON.stringify(list))
}

function clearHistory() {
  searchHistory.value = []
  uni.removeStorageSync(HISTORY_KEY)
}

function toggleSearch() {
  searchMode.value = true
  hasSearched.value = false
  loadHistory()
}

function cancelSearch() {
  searchMode.value = false
  searchKeyword.value = ''
  hasSearched.value = false
  // 恢复全部商品
  fetchGoods(true)
}

function onBlur() {
  // 输入框失焦时，如果有关键词则保留搜索状态，仅关闭输入模式
  if (searchKeyword.value.trim()) {
    searchMode.value = false
  } else {
    searchMode.value = false
  }
}

let searchDebounce: any = null

function onSearchInput() {
  // 实时搜索防抖
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    const kw = searchKeyword.value.trim()
    if (kw.length >= 1) {
      hasSearched.value = true
      fetchGoods(true)
    }
  }, 500)
}

function doSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  saveHistory(kw)
  hasSearched.value = true
  searchMode.value = false
  fetchGoods(true)
}

function searchByHistory(tag: string) {
  searchKeyword.value = tag
  saveHistory(tag)
  hasSearched.value = true
  searchMode.value = false
  fetchGoods(true)
}

// 搜索高亮
function highlightTitle(title: string): string {
  const kw = searchKeyword.value.trim()
  if (!kw) return title
  // 转义正则特殊字符
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return title.replace(regex, '<span style="color:#c2703e;font-weight:600">$1</span>')
}

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
    if (currentCommunity.value !== '全部社区') {
      params.community = currentCommunity.value
    }
    // 搜索关键词（同时搜索商品名称和类别）
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
      // 匹配分类名称时，取消分类筛选
      const matchedCat = categories.value.find(c => c.name === searchKeyword.value.trim())
      if (matchedCat && matchedCat.name !== '全部') {
        params.category = matchedCat.name
      }
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
    skeletonLoading.value = false
    uni.stopPullDownRefresh()
  }
}

function selectCategory(name: string) {
  currentCategory.value = name
  fetchGoods(true)
}

function switchCommunity(e: any) {
  currentCommunity.value = communities.value[e.detail.value]
  fetchGoods(true)
}

onReachBottom(() => fetchGoods())

onPullDownRefresh(() => {
  refreshing.value = true
  fetchGoods(true)
})

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

onMounted(async () => {
  try {
    const data = await locationApi.getList()
    const communityList = data.communities || []
    communities.value = ['全部社区', ...communityList.map((l: any) => l.name)]
  } catch {}
  fetchGoods(true)
})

// 从发布页返回时自动刷新
onShow(() => {
  if (!skeletonLoading.value) {
    fetchGoods(true)
  }
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
  padding-bottom: 20rpx;
  max-width: 100vw;
  overflow-x: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 20rpx 24rpx;
}

.community-picker {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 20rpx;
  background: $surface;
  border-radius: $radius;
  flex-shrink: 0;
}

.community-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text;
  max-width: 160rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.community-arrow {
  font-size: 20rpx;
  color: $text-tertiary;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $surface;
  border-radius: $radius;
  padding: 16rpx 24rpx;
  flex: 1;
  box-sizing: border-box;
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid $text-tertiary;
  border-radius: 50%;
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 28rpx;
  color: $text-tertiary;
  flex: 1;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: $text;
  height: 40rpx;
  line-height: 40rpx;
}

.search-cancel {
  flex-shrink: 0;
  padding: 4rpx 0;
  text { font-size: 28rpx; color: $accent; }
}

/* 搜索历史 */
.history-section { margin: 0 24rpx; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.history-title { font-size: 26rpx; color: $text-secondary; font-weight: 600; }
.history-clear { padding: 8rpx 16rpx; text { font-size: 24rpx; color: $text-tertiary; } }
.history-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.history-tag {
  padding: 12rpx 24rpx; background: $surface; border-radius: 32rpx;
  text { font-size: 24rpx; color: $text-secondary; }
}

.categories {
  white-space: nowrap;
  padding: 0 24rpx 20rpx;
  overflow: hidden;
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

/* 骨架屏 */
.skeleton-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx 20rpx 0;
  box-sizing: border-box;
}
.skeleton-card {
  width: 50%;
  box-sizing: border-box;
  padding: 0 10rpx;
  margin-bottom: 20rpx;
}
.skeleton-img {
  height: 240rpx;
  background: $surface;
  border-radius: $radius $radius 0 0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-text {
  height: 28rpx;
  background: $surface;
  margin: 16rpx 20rpx;
  border-radius: 8rpx;
  animation: skeleton-pulse 1.5s ease-in-out infinite;

  &.short {
    width: 60%;
    margin-bottom: 20rpx;
  }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
  min-height: 72rpx;
  line-height: 1.4;
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
