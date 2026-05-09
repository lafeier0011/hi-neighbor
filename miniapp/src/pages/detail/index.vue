<template>
  <view class="page">
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">←</text>
      <text class="nav-title">商品详情</text>
      <text class="nav-action" @tap="share">分享</text>
    </view>

    <scroll-view scroll-y class="content">
      <!-- 图片 -->
      <swiper class="img-swiper" indicator-dots autoplay circular>
        <swiper-item v-for="(img, i) in detail.images" :key="i">
          <image :src="img" mode="aspectFill" class="swiper-img" />
        </swiper-item>
        <swiper-item v-if="!detail.images?.length">
          <view class="img-empty" />
        </swiper-item>
      </swiper>

      <!-- 价格 -->
      <view class="detail-content">
        <view class="price-row">
          <text class="price">¥{{ detail.price }}</text>
          <text v-if="detail.originalPrice" class="original">¥{{ detail.originalPrice }}</text>
        </view>

        <text class="detail-title">{{ detail.title }}</text>

        <view class="tags">
          <text class="tag condition">{{ detail.condition }}</text>
          <text class="tag">{{ detail.category }}</text>
          <text class="tag" v-if="detail.location">{{ detail.location }}</text>
          <text class="tag sold" v-if="detail.status === 'sold'">已卖出</text>
        </view>
      </view>

      <view class="section-divider" />

      <!-- 描述 -->
      <view class="detail-content">
        <text class="section-label">描述</text>
        <text class="detail-desc">{{ detail.description || '暂无描述' }}</text>
      </view>

      <!-- 卖家 -->
      <view class="seller-card">
        <view class="seller-top">
          <view class="seller-avatar" />
          <view>
            <text class="seller-name">{{ detail.publisherInfo?.nickname || '微信用户' }}</text>
            <text class="seller-loc">{{ detail.publisherInfo?.community || '' }}</text>
          </view>
        </view>

        <!-- 联系方式 -->
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
    </scroll-view>

    <!-- 底部栏 -->
    <view class="bottom-bar">
      <!-- 买家视角 -->
      <template v-if="!isOwner">
        <view class="fav-btn" @tap="toggleFav">
          <text>{{ favorited ? '♥' : '♡' }}</text>
        </view>
        <view class="contact-action" @tap="copyContact">
          <text>联系卖家</text>
        </view>
      </template>
      <!-- 卖家视角 -->
      <template v-else>
        <view v-if="detail.status === 'on_sale'" class="sell-btn" @tap="markSold">
          <text>标记已卖出</text>
        </view>
        <view class="delete-btn" @tap="deleteGoods">
          <text>删除商品</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { goodsApi, favoritesApi } from '../../api'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const detail = ref<any>({})
const favorited = ref(false)
const copyText = ref('复制')
const goodsId = ref('')

const isOwner = computed(() => detail.value.publisherId === userStore.userInfo?.openid)

async function fetchDetail() {
  if (!goodsId.value) return
  try {
    const res = await goodsApi.getDetail(goodsId.value)
    detail.value = Array.isArray(res) ? res[0] : res
  } catch {}
}

function goBack() { uni.navigateBack() }
function share() { /* TODO */ }

function copy(val: string) {
  uni.setClipboardData({
    data: val,
    success: () => {
      copyText.value = '已复制'
      setTimeout(() => copyText.value = '复制', 1500)
    },
  })
}

function copyContact() {
  const wechat = detail.value.contactWechat
  const phone = detail.value.contactPhone
  if (wechat) copy(wechat)
  else if (phone) copy(phone)
}

async function toggleFav() {
  try {
    const data = await favoritesApi.toggle(goodsId.value)
    favorited.value = data.favorited
  } catch {}
}

async function markSold() {
  uni.showModal({
    title: '确认',
    content: '确定标记为已卖出？标记后1天自动下架',
    success: async (res) => {
      if (res.confirm) {
        await goodsApi.markSold(goodsId.value)
        uni.showToast({ title: '已标记', icon: 'success' })
        fetchDetail()
      }
    },
  })
}

async function deleteGoods() {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定删除？',
    success: async (res) => {
      if (res.confirm) {
        await goodsApi.deleteGoods(goodsId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    },
  })
}

onLoad((options: any) => {
  goodsId.value = options.id || ''
  fetchDetail()
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
.nav-action { font-size: 26rpx; color: $text-tri; }

.content { flex: 1; height: 0; }
.img-swiper { height: 560rpx; }
.swiper-img { width: 100%; height: 100%; }
.img-empty { width: 100%; height: 100%; background: $surface; }

.detail-content { padding: 32rpx; }
.price-row { display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 12rpx; }
.price { font-size: 56rpx; font-weight: 700; color: $accent; }
.original { font-size: 28rpx; color: $text-tri; text-decoration: line-through; }
.detail-title { font-size: 34rpx; font-weight: 600; line-height: 1.5; display: block; margin-bottom: 20rpx; }
.tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 6rpx; background: $surface; color: $text-sec; }
.tag.condition { background: $accent-light; color: $accent; font-weight: 600; }
.tag.sold { background: #fdf6e3; color: #d4a017; font-weight: 600; }

.section-divider { height: 2rpx; background: $border; margin: 0 32rpx; }
.section-label { font-size: 24rpx; font-weight: 600; color: $text-tri; letter-spacing: 1rpx; margin-bottom: 16rpx; display: block; }
.detail-desc { font-size: 28rpx; color: $text-sec; line-height: 1.7; }

.seller-card { margin: 24rpx 32rpx; padding: 24rpx; background: $surface; border-radius: $radius; border: 2rpx solid $border; }
.seller-top { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.seller-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: $border; }
.seller-name { font-size: 30rpx; font-weight: 600; display: block; }
.seller-loc { font-size: 24rpx; color: $text-tri; margin-top: 4rpx; display: block; }
.contact-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 24rpx;
  background: $bg; border-radius: 12rpx; border: 2rpx solid $border; margin-bottom: 12rpx; }
.contact-info { display: flex; align-items: center; gap: 12rpx; }
.contact-type { font-size: 20rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 6rpx;
  &.wechat { background: $accent-light; color: $accent; }
  &.phone { background: #e8f0f8; color: #2c5f8a; }
}
.contact-value { font-size: 28rpx; color: $text; font-weight: 500; }
.copy-btn { padding: 12rpx 24rpx; background: $accent; border-radius: 12rpx;
  text { color: #fff; font-size: 24rpx; font-weight: 600; } }

.bottom-bar {
  display: flex; align-items: center; padding: 16rpx 32rpx; gap: 16rpx;
  border-top: 2rpx solid $border; background: $bg;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.fav-btn { width: 88rpx; height: 88rpx; border: 2rpx solid $border; border-radius: $radius;
  display: flex; align-items: center; justify-content: center; font-size: 40rpx; }
.contact-action { flex: 1; height: 88rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 30rpx; font-weight: 600; } }
.sell-btn { flex: 1; height: 88rpx; background: $success; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 30rpx; font-weight: 600; } }
.delete-btn { flex: 1; height: 88rpx; background: $surface; border-radius: $radius;
  border: 2rpx solid $border;
  display: flex; align-items: center; justify-content: center;
  text { color: $error; font-size: 30rpx; font-weight: 600; } }
</style>
