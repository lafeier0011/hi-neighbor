<template>
  <view class="page">
    <!-- Nav -->
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">←</text>
      <text class="nav-title">发布</text>
      <text class="nav-action">草稿箱</text>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 类型 -->
      <view class="type-tabs">
        <view class="type-tab" :class="{ active: type === 'goods' }" @tap="type = 'goods'">二手好物</view>
        <view class="type-tab" :class="{ active: type === 'group' }" @tap="type = 'group'">拼团服务</view>
      </view>

      <!-- 图片 -->
      <view class="form-group">
        <text class="form-label">图片</text>
        <view class="photo-upload">
          <view v-for="(img, i) in images" :key="i" class="photo-slot filled">
            <image :src="img" class="photo-img" mode="aspectFill" />
          </view>
          <view v-if="images.length < 9" class="photo-slot" @tap="chooseImage">
            <text class="plus">+</text>
            <text class="label">添加</text>
          </view>
        </view>
      </view>

      <!-- 名称 -->
      <view class="form-group">
        <text class="form-label">名称 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="form.title"
          placeholder="描述一下你的宝贝"
          maxlength="30"
          @input="onTitleInput"
        />
        <view class="form-hint">
          <text class="error-msg" v-if="errors.title">{{ errors.title }}</text>
          <text class="count">{{ form.title.length }}/30</text>
        </view>
      </view>

      <!-- 描述 -->
      <view class="form-group">
        <text class="form-label">描述</text>
        <textarea
          class="form-textarea"
          v-model="form.description"
          placeholder="品牌、尺寸、新旧程度..."
          maxlength="300"
        />
        <view class="form-hint">
          <text />
          <text class="count">{{ form.description.length }}/300</text>
        </view>
      </view>

      <!-- 成色 -->
      <view class="form-group">
        <text class="form-label">成色 <text class="required">*</text></text>
        <view class="option-list">
          <view
            v-for="c in conditions"
            :key="c"
            class="option-item"
            :class="{ active: form.condition === c }"
            @tap="form.condition = c"
          >
            {{ c }}
          </view>
        </view>
      </view>

      <!-- 分类 -->
      <view class="form-group">
        <text class="form-label">分类</text>
        <view class="option-list">
          <view
            v-for="c in categories"
            :key="c"
            class="option-item"
            :class="{ active: form.category === c }"
            @tap="form.category = c"
          >
            {{ c }}
          </view>
        </view>
      </view>

      <!-- 价格 -->
      <view class="price-row">
        <view class="form-group half">
          <text class="form-label">售价 <text class="required">*</text></text>
          <view class="price-input">
            <text class="price-prefix">¥</text>
            <input type="digit" v-model="form.price" placeholder="0" />
          </view>
        </view>
        <view class="form-group half">
          <text class="form-label">原价</text>
          <view class="price-input">
            <text class="price-prefix">¥</text>
            <input type="digit" v-model="form.originalPrice" placeholder="选填" />
          </view>
        </view>
      </view>

      <!-- 交易地点 -->
      <view class="form-group">
        <text class="form-label">交易地点</text>
        <view class="location-picker" @tap="showLocationPicker = true">
          <text :class="['location-text', { placeholder: !form.location }]">
            {{ form.location || '选择或输入交易地点' }}
          </text>
          <text class="arrow">›</text>
        </view>
        <!-- 自定义输入 -->
        <input
          class="form-input"
          v-model="form.location"
          placeholder="或手动输入交易地点"
          style="margin-top: 12rpx;"
        />
      </view>

      <!-- 分割线 -->
      <view class="divider" />

      <!-- 联系方式 -->
      <view class="form-group">
        <text class="form-label">联系方式 <text class="required">*</text></text>
        <text class="contact-hint">至少填写一项，方便买家联系你</text>

        <view class="contact-row">
          <text class="contact-label">微信号</text>
          <input
            class="contact-input"
            v-model="form.contactWechat"
            placeholder="输入微信号"
            :class="{ error: errors.wechat }"
          />
        </view>
        <text class="field-hint" :class="{ error: errors.wechat }">{{ errors.wechat || '6-20位，字母开头' }}</text>

        <view class="contact-row">
          <text class="contact-label">手机号</text>
          <input
            class="contact-input"
            v-model="form.contactPhone"
            placeholder="输入手机号"
            type="number"
            maxlength="11"
            :class="{ error: errors.phone }"
          />
        </view>
        <text class="field-hint" :class="{ error: errors.phone }">{{ errors.phone || '11位手机号' }}</text>

        <text class="error-msg" v-if="errors.contact">{{ errors.contact }}</text>
      </view>

      <view style="height: 40rpx;" />
    </scroll-view>

    <!-- 提交 -->
    <view class="submit-btn" @tap="submit">发布</view>

    <!-- 地址选择弹窗 -->
    <view class="picker-mask" v-if="showLocationPicker" @tap="showLocationPicker = false">
      <view class="picker-panel" @tap.stop>
        <text class="picker-title">选择交易地点</text>
        <view class="picker-list">
          <view
            v-for="loc in locations"
            :key="loc._id"
            class="picker-item"
            :class="{ active: form.location === loc.name }"
            @tap="selectLocation(loc.name)"
          >
            {{ loc.name }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { goodsApi, locationApi } from '../../api'
import {
  validateTitle, validatePrice, validateCondition,
  validateWechat, validatePhone, validateContact, validateDesc,
} from '../../utils/validate'

const type = ref('goods')
const images = ref<string[]>([])
const showLocationPicker = ref(false)
const locations = ref<any[]>([])

const conditions = ['全新', '9成新', '7成新', '5成新', '一般']
const categories = ['母婴', '玩具', '书籍', '家居', '服饰', '数码', '其他']

const form = reactive({
  title: '',
  description: '',
  condition: '9成新',
  category: '母婴',
  price: '',
  originalPrice: '',
  location: '',
  contactWechat: '',
  contactPhone: '',
})

const errors = reactive<Record<string, string>>({})

function onTitleInput() {
  if (form.title.length > 30) form.title = form.title.slice(0, 30)
}

async function chooseImage() {
  const [, res] = await uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'] })
  if (res?.tempFilePaths) {
    images.value = [...images.value, ...res.tempFilePaths]
  }
}

function selectLocation(name: string) {
  form.location = name
  showLocationPicker.value = false
}

function goBack() {
  uni.navigateBack()
}

function validate(): boolean {
  // 清空错误
  Object.keys(errors).forEach(k => delete errors[k])

  let err: string | null

  err = validateTitle(form.title)
  if (err) { errors.title = err; return false }

  err = validatePrice(form.price)
  if (err) { errors.price = err; return false }

  err = validateCondition(form.condition)
  if (err) { errors.condition = err; return false }

  err = validateDesc(form.description)
  if (err) { errors.description = err; return false }

  // 联系方式
  if (form.contactWechat) {
    err = validateWechat(form.contactWechat)
    if (err) { errors.wechat = err; return false }
  }

  if (form.contactPhone) {
    err = validatePhone(form.contactPhone)
    if (err) { errors.phone = err; return false }
  }

  err = validateContact(form.contactWechat, form.contactPhone)
  if (err) { errors.contact = err; return false }

  return true
}

async function submit() {
  if (!validate()) return

  uni.showLoading({ title: '发布中...' })
  try {
    await goodsApi.publish({
      title: form.title,
      description: form.description,
      condition: form.condition,
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      location: form.location,
      contactWechat: form.contactWechat,
      contactPhone: form.contactPhone,
      images: images.value,
    })
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.hideLoading()
  }
}

onMounted(async () => {
  try {
    locations.value = await locationApi.getList()
  } catch {}
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
$error: #c0392b;
$radius: 16rpx;

.page { min-height: 100vh; background: $bg; display: flex; flex-direction: column; }
.nav-bar {
  height: 88rpx; display: flex; align-items: center; justify-content: space-between;
  padding: 0 32rpx; border-bottom: 2rpx solid $border;
}
.nav-back { font-size: 36rpx; color: $text; }
.nav-title { font-size: 32rpx; font-weight: 600; }
.nav-action { font-size: 26rpx; color: $text-tertiary; }

.form-scroll { flex: 1; }

.type-tabs {
  display: flex; padding: 24rpx 32rpx; gap: 16rpx;
}
.type-tab {
  flex: 1; padding: 20rpx; text-align: center; border-radius: $radius;
  font-size: 28rpx; font-weight: 500; background: $surface; color: $text-secondary;
  border: 2rpx solid transparent;
  &.active { border-color: $text; color: $text; font-weight: 600; background: $bg; }
}

.form-group { padding: 0 32rpx; margin-bottom: 32rpx; }
.form-group.half { flex: 1; }
.form-label {
  font-size: 24rpx; color: $text-tertiary; font-weight: 500;
  letter-spacing: 1rpx; display: block; margin-bottom: 12rpx;
}
.required { color: $error; }
.form-input {
  width: 100%; padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; background: $bg;
}
.form-textarea {
  width: 100%; padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; height: 160rpx; background: $bg;
}
.form-hint { display: flex; justify-content: space-between; margin-top: 8rpx; font-size: 22rpx; }
.count { color: $text-tertiary; }
.error-msg { color: $error; font-size: 22rpx; }

.photo-upload { display: flex; gap: 16rpx; flex-wrap: wrap; }
.photo-slot {
  width: 144rpx; height: 144rpx; border: 2rpx solid $border; border-radius: $radius;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: $surface;
}
.photo-slot.filled { border: none; }
.photo-img { width: 100%; height: 100%; }
.plus { font-size: 40rpx; color: $text-tertiary; font-weight: 300; }
.label { font-size: 20rpx; color: $text-tertiary; margin-top: 4rpx; }

.option-list { display: flex; gap: 16rpx; flex-wrap: wrap; }
.option-item {
  padding: 12rpx 28rpx; border-radius: 40rpx; font-size: 26rpx;
  color: $text-secondary; border: 2rpx solid $border; font-weight: 500;
  &.active { background: $accent; color: #fff; border-color: $accent; }
}

.price-row { display: flex; gap: 20rpx; padding: 0 32rpx; }
.price-input {
  display: flex; align-items: center; border: 2rpx solid $border;
  border-radius: $radius; overflow: hidden;
}
.price-prefix {
  padding: 24rpx 28rpx; background: $surface; font-size: 28rpx;
  color: $text; font-weight: 600; border-right: 2rpx solid $border;
}
.price-input input { flex: 1; padding: 24rpx 28rpx; font-size: 28rpx; }

.location-picker {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius;
}
.location-text { font-size: 28rpx; color: $text; &.placeholder { color: $text-tertiary; } }
.arrow { color: $text-tertiary; font-size: 28rpx; }

.divider { height: 2rpx; background: $border; margin: 8rpx 32rpx 32rpx; }

.contact-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.contact-label { width: 96rpx; font-size: 24rpx; color: $text-secondary; font-weight: 500; flex-shrink: 0; }
.contact-input {
  flex: 1; padding: 20rpx 24rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; &.error { border-color: $error; }
}
.contact-hint { font-size: 22rpx; color: $text-tertiary; display: block; margin-bottom: 12rpx; }
.field-hint { font-size: 22rpx; color: $text-tertiary; margin-left: 112rpx; margin-bottom: 8rpx; display: block;
  &.error { color: $error; }
}

.submit-btn {
  margin: 32rpx; padding: 28rpx; background: $accent; color: #fff;
  font-size: 30rpx; font-weight: 600; text-align: center; border-radius: $radius;
}

.picker-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end;
}
.picker-panel {
  width: 100%; background: $bg; border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx; max-height: 60vh;
}
.picker-title { font-size: 30rpx; font-weight: 600; margin-bottom: 24rpx; display: block; }
.picker-item {
  padding: 24rpx; border-bottom: 2rpx solid $surface; font-size: 28rpx; color: $text;
  &.active { color: $accent; font-weight: 600; }
}
</style>
