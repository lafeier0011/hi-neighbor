<template>
  <view class="page">
    <!-- Nav -->
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">←</text>
      <text class="nav-title">发起拼团</text>
      <text class="nav-action" />
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 图片 -->
      <view class="form-group">
        <text class="form-label">商品图片</text>
        <view class="photo-upload">
          <view v-for="(img, i) in images" :key="i" class="photo-slot filled">
            <image :src="img" class="photo-img" mode="aspectFill" />
            <view class="photo-del" @tap="removeImage(i)">×</view>
          </view>
          <view v-if="images.length < 9" class="photo-slot" @tap="chooseImage">
            <text class="plus">+</text>
            <text class="label">添加</text>
          </view>
        </view>
      </view>

      <!-- 标题 -->
      <view class="form-group">
        <text class="form-label">拼团标题 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="form.title"
          placeholder="描述一下你要拼的商品"
          maxlength="30"
        />
        <view class="form-hint">
          <text class="error-msg" v-if="errors.title">{{ errors.title }}</text>
          <text class="count">{{ form.title.length }}/30</text>
        </view>
      </view>

      <!-- 描述 -->
      <view class="form-group">
        <text class="form-label">详细描述</text>
        <textarea
          class="form-textarea"
          v-model="form.description"
          placeholder="品牌、规格、数量、拼团规则说明..."
          maxlength="500"
        />
        <view class="form-hint">
          <text />
          <text class="count">{{ form.description.length }}/500</text>
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
          <text class="form-label">拼团价 <text class="required">*</text></text>
          <view class="price-input">
            <text class="price-prefix">¥</text>
            <input type="digit" v-model="form.groupPrice" placeholder="0" />
          </view>
          <text class="error-msg" v-if="errors.groupPrice">{{ errors.groupPrice }}</text>
        </view>
        <view class="form-group half">
          <text class="form-label">原价</text>
          <view class="price-input">
            <text class="price-prefix">¥</text>
            <input type="digit" v-model="form.originalPrice" placeholder="选填" />
          </view>
        </view>
      </view>

      <!-- 目标人数 -->
      <view class="form-group">
        <text class="form-label">目标人数 <text class="required">*</text></text>
        <view class="number-picker">
          <view class="picker-btn" @tap="changeTarget(-1)">−</view>
          <text class="picker-value">{{ form.targetCount }}人</text>
          <view class="picker-btn" @tap="changeTarget(1)">+</view>
        </view>
        <text class="error-msg" v-if="errors.targetCount">{{ errors.targetCount }}</text>
      </view>

      <!-- 截止时间 -->
      <view class="form-group">
        <text class="form-label">截止时间 <text class="required">*</text></text>
        <view class="datetime-row">
          <picker mode="date" :value="datePart" :start="todayStr" @change="onDateChange">
            <view class="picker-field">
              <text :class="['picker-text', { placeholder: !datePart }]">{{ datePart || '选择日期' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>
          <picker mode="time" :value="timePart" @change="onTimeChange">
            <view class="picker-field">
              <text :class="['picker-text', { placeholder: !timePart }]">{{ timePart || '选择时间' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>
        </view>
        <text class="error-msg" v-if="errors.deadline">{{ errors.deadline }}</text>
      </view>

      <!-- 分割线 -->
      <view class="divider" />

      <!-- 联系方式 -->
      <view class="form-group">
        <text class="form-label">联系方式 <text class="required">*</text></text>
        <text class="contact-hint">至少填写一项，方便邻居联系你</text>

        <view class="contact-row">
          <text class="contact-label">微信号</text>
          <input
            class="contact-input"
            v-model="form.contactWechat"
            placeholder="输入微信号"
          />
        </view>

        <view class="contact-row">
          <text class="contact-label">手机号</text>
          <input
            class="contact-input"
            v-model="form.contactPhone"
            placeholder="输入手机号"
            type="number"
            maxlength="11"
          />
        </view>

        <text class="error-msg" v-if="errors.contact">{{ errors.contact }}</text>
      </view>

      <view style="height: 40rpx;" />
    </scroll-view>

    <!-- 提交 -->
    <view class="submit-btn" :class="{ disabled: submitting }" @tap="submit">
      <text>{{ submitting ? '发布中...' : '发起拼团' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { groupbuyApi } from '../../api'
import { http } from '../../utils/request'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const images = ref<string[]>([])     // 本地临时路径
const submitting = ref(false)

const categories = ['母婴', '玩具', '书籍', '家居', '服饰', '数码', '食品', '其他']

const form = reactive({
  title: '',
  description: '',
  category: '母婴',
  originalPrice: '',
  groupPrice: '',
  targetCount: 3,
  contactWechat: '',
  contactPhone: '',
})

const errors = reactive<Record<string, string>>({})

// 日期时间选择
const datePart = ref('')
const timePart = ref('')

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function onDateChange(e: any) {
  datePart.value = e.detail.value
}

function onTimeChange(e: any) {
  timePart.value = e.detail.value
}

function changeTarget(delta: number) {
  const newVal = form.targetCount + delta
  if (newVal >= 2 && newVal <= 100) {
    form.targetCount = newVal
  }
}

function goBack() {
  uni.navigateBack()
}

async function chooseImage() {
  const [, res] = await uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'] })
  if (res?.tempFilePaths) {
    images.value = [...images.value, ...res.tempFilePaths]
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

async function uploadImages(): Promise<string[]> {
  const urls: string[] = []
  for (const localPath of images.value) {
    if (localPath.startsWith('http')) {
      urls.push(localPath)
      continue
    }
    const res = await http.uploadFile(localPath)
    urls.push(res.url)
  }
  return urls
}

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.title.trim()) {
    errors.title = '请输入拼团标题'
    return false
  }

  if (!form.groupPrice || Number(form.groupPrice) <= 0) {
    errors.groupPrice = '拼团价必须大于0'
    return false
  }

  if (form.targetCount < 2) {
    errors.targetCount = '目标人数至少2人'
    return false
  }

  if (!datePart.value || !timePart.value) {
    errors.deadline = '请选择截止时间'
    return false
  }

  const deadline = new Date(`${datePart.value}T${timePart.value}:00`)
  if (deadline.getTime() <= Date.now()) {
    errors.deadline = '截止时间必须在未来'
    return false
  }

  if (!form.contactWechat && !form.contactPhone) {
    errors.contact = '请至少填写一项联系方式'
    return false
  }

  return true
}

async function submit() {
  if (submitting.value) return
  if (!userStore.isLoggedIn()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (!validate()) return

  submitting.value = true
  uni.showLoading({ title: '发布中...' })

  try {
    // 上传图片
    let uploadedImages: string[] = []
    if (images.value.length > 0) {
      uni.showLoading({ title: '上传图片中...' })
      uploadedImages = await uploadImages()
    }

    uni.showLoading({ title: '发布中...' })

    const deadline = `${datePart.value}T${timePart.value}:00`
    await groupbuyApi.create({
      title: form.title.trim(),
      description: form.description.trim(),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      groupPrice: Number(form.groupPrice),
      targetCount: form.targetCount,
      deadline,
      images: uploadedImages,
      category: form.category,
      contactWechat: form.contactWechat,
      contactPhone: form.contactPhone,
    })

    uni.hideLoading()
    uni.showToast({ title: '拼团发起成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.hideLoading()
    submitting.value = false
  }
}
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

.page { min-height: 100vh; background: $bg; display: flex; flex-direction: column; overflow-x: hidden; }
.nav-bar {
  height: 88rpx; display: flex; align-items: center; justify-content: space-between;
  padding: 0 32rpx; border-bottom: 2rpx solid $border;
}
.nav-back { font-size: 36rpx; color: $text; }
.nav-title { font-size: 32rpx; font-weight: 600; }
.nav-action { width: 60rpx; }

.form-scroll { flex: 1; }

.form-group { padding: 0 24rpx; margin-bottom: 32rpx; }
.form-group.half { flex: 1; }
.form-label {
  font-size: 24rpx; color: $text-tertiary; font-weight: 500;
  letter-spacing: 1rpx; display: block; margin-bottom: 12rpx;
}
.required { color: $error; }
.form-input {
  width: 100%; height: 80rpx; padding: 0 28rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; background: $bg; box-sizing: border-box; line-height: 80rpx;
}
.form-textarea {
  width: 100%; padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; height: 160rpx; background: $bg; box-sizing: border-box;
}
.form-hint { display: flex; justify-content: space-between; margin-top: 8rpx; font-size: 22rpx; }
.count { color: $text-tertiary; }
.error-msg { color: $error; font-size: 22rpx; margin-top: 8rpx; display: block; }

.photo-upload { display: flex; gap: 16rpx; flex-wrap: wrap; }
.photo-slot {
  width: 144rpx; height: 144rpx; border: 2rpx solid $border; border-radius: $radius;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: $surface; position: relative;
}
.photo-slot.filled { border: none; }
.photo-img { width: 100%; height: 100%; }
.photo-del {
  position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx;
  background: rgba(0,0,0,0.5); border-radius: 50%; color: #fff; font-size: 24rpx;
  display: flex; align-items: center; justify-content: center;
}
.plus { font-size: 40rpx; color: $text-tertiary; font-weight: 300; }
.label { font-size: 20rpx; color: $text-tertiary; margin-top: 4rpx; }

.option-list { display: flex; gap: 16rpx; flex-wrap: wrap; }
.option-item {
  padding: 12rpx 28rpx; border-radius: 40rpx; font-size: 26rpx;
  color: $text-secondary; border: 2rpx solid $border; font-weight: 500;
  &.active { background: $accent; color: #fff; border-color: $accent; }
}

.price-row { display: flex; gap: 20rpx; padding: 0 24rpx; }
.price-input {
  display: flex; align-items: center; border: 2rpx solid $border;
  border-radius: $radius; overflow: hidden;
}
.price-prefix {
  padding: 24rpx 28rpx; background: $surface; font-size: 28rpx;
  color: $text; font-weight: 600; border-right: 2rpx solid $border;
}
.price-input input { flex: 1; height: 72rpx; padding: 0 28rpx; font-size: 28rpx; }

.number-picker {
  display: flex; align-items: center; gap: 24rpx;
}
.picker-btn {
  width: 72rpx; height: 72rpx; border: 2rpx solid $border; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: $text; font-weight: 600; background: $surface;
}
.picker-value {
  font-size: 32rpx; font-weight: 600; color: $text; min-width: 80rpx; text-align: center;
}

.datetime-row { display: flex; gap: 16rpx; }
.picker-field {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius; box-sizing: border-box;
}
.picker-text { font-size: 28rpx; color: $text; &.placeholder { color: $text-tertiary; } }
.arrow { color: $text-tertiary; font-size: 28rpx; }

.divider { height: 2rpx; background: $border; margin: 8rpx 24rpx 32rpx; }

.contact-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx; }
.contact-label { width: 96rpx; font-size: 24rpx; color: $text-secondary; font-weight: 500; flex-shrink: 0; }
.contact-input {
  flex: 1; height: 72rpx; padding: 0 24rpx; border: 2rpx solid $border; border-radius: $radius;
  font-size: 28rpx; line-height: 72rpx;
}
.contact-hint { font-size: 22rpx; color: $text-tertiary; display: block; margin-bottom: 12rpx; }

.submit-btn {
  margin: 32rpx; padding: 28rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 30rpx; font-weight: 600; }
  &.disabled { background: $surface;
    text { color: $text-tertiary; }
  }
}
</style>
