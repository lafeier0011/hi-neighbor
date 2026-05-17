<template>
  <view class="page">
    <!-- Nav -->
    <view class="nav-bar">
      <text class="nav-title">{{ editId ? '编辑商品' : '发布' }}</text>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 类型切换（编辑模式隐藏） -->
      <view v-if="!editId" class="type-tabs">
        <view class="type-tab" :class="{ active: type === 'goods' }" @tap="switchType('goods')">二手好物</view>
        <view class="type-tab" :class="{ active: type === 'group' }" @tap="switchType('group')">拼团服务</view>
      </view>

      <!-- 图片 -->
      <view class="form-group">
        <text class="form-label">图片</text>
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

      <!-- 名称 -->
      <view class="form-group">
        <text class="form-label">{{ type === 'group' ? '拼团标题' : '商品名称' }} <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="form.title"
          :placeholder="type === 'group' ? '描述一下你要拼的商品' : '描述一下你的宝贝'"
          maxlength="30"
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

      <!-- 成色（仅二手商品） -->
      <view v-if="type === 'goods'" class="form-group">
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

      <!-- 分类（仅拼团显示） -->
      <view v-if="type === 'group'" class="form-group">
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

      <!-- 价格：二手商品 -->
      <view v-if="type === 'goods'" class="price-row">
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

      <!-- 价格：拼团 -->
      <view v-if="type === 'group'" class="price-row">
        <view class="form-group half">
          <text class="form-label">拼团价 <text class="required">*</text></text>
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

      <!-- 目标人数（仅拼团） -->
      <view v-if="type === 'group'" class="form-group">
        <text class="form-label">目标人数 <text class="required">*</text></text>
        <view class="number-picker">
          <view class="picker-btn" @tap="changeTarget(-1)">−</view>
          <text class="picker-value">{{ form.targetCount }}人</text>
          <view class="picker-btn" @tap="changeTarget(1)">+</view>
        </view>
      </view>

      <!-- 截止时间（仅拼团） -->
      <view v-if="type === 'group'" class="form-group">
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

      <!-- 交易地点（仅二手商品） -->
      <view v-if="type === 'goods'" class="form-group">
        <text class="form-label">交易地点</text>
        <view class="location-picker" @tap="showLocationPicker = true">
          <text :class="['location-text', { placeholder: !form.location }]">
            {{ form.location || '选择或输入交易地点' }}
          </text>
          <text class="arrow">›</text>
        </view>
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
        <text class="contact-hint">至少填写一项，方便{{ type === 'group' ? '邻居' : '买家' }}联系你</text>

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
      <text>{{ submitting ? '提交中...' : (editId ? '保存修改' : (type === 'group' ? '发起拼团' : '发布')) }}</text>
    </view>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'
import { goodsApi, groupbuyApi, locationApi } from '../../api'
import { http } from '../../utils/request'

const userStore = useUserStore()
const type = ref('goods')
const images = ref<string[]>([])
const showLocationPicker = ref(false)
const locations = ref<any[]>([])
const submitting = ref(false)
const editId = ref('')

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
  targetCount: 3,
})

// 拼团日期时间
const datePart = ref('')
const timePart = ref('')
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const errors = reactive<Record<string, string>>({})

function switchType(t: string) {
  if (t === type.value) return
  type.value = t
  // 切换时重置表单
  Object.keys(errors).forEach(k => delete errors[k])
}

function changeTarget(delta: number) {
  const newVal = form.targetCount + delta
  if (newVal >= 2 && newVal <= 100) {
    form.targetCount = newVal
  }
}

function onDateChange(e: any) { datePart.value = e.detail.value }
function onTimeChange(e: any) { timePart.value = e.detail.value }

async function chooseImage() {
  // #ifdef H5
  // H5 环境：使用原生 input[type=file]
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => {
    const files = input.files
    if (!files) return
    const remaining = 9 - images.value.length
    const toProcess = Array.from(files).slice(0, remaining)
    for (const file of toProcess) {
      const url = URL.createObjectURL(file)
      images.value = [...images.value, url]
    }
  }
  input.click()
  // #endif
  // #ifndef H5
  const [, res] = await uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'] })
  if (res?.tempFilePaths) {
    images.value = [...images.value, ...res.tempFilePaths]
  }
  // #endif
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

    // #ifdef H5
    // H5 环境：blob URL 需要先转成 File 再上传
    const response = await fetch(localPath)
    const blob = await response.blob()
    const fileName = `image_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
    const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })

    const formData = new FormData()
    formData.append('file', file)

    const token = uni.getStorageSync('token') || ''
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json()
    if (data.code === 0) {
      urls.push(data.data.url)
    } else {
      throw new Error(data.message || '上传失败')
    }
    // #endif

    // #ifndef H5
    const res2 = await http.uploadFile(localPath)
    urls.push(res2.url)
    // #endif
  }
  return urls
}

function selectLocation(name: string) {
  form.location = name
  showLocationPicker.value = false
}

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.title.trim()) {
    errors.title = '请输入名称'
    return false
  }

  if (!form.price || Number(form.price) <= 0) {
    errors.price = '请输入有效价格'
    return false
  }

  if (type.value === 'goods' && !form.condition) {
    errors.condition = '请选择成色'
    return false
  }

  if (type.value === 'group') {
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

  // 编辑模式：更新商品
  if (editId.value) {
    submitting.value = true
    uni.showLoading({ title: '保存中...' })
    try {
      let uploadedImages: string[] = []
      if (images.value.length > 0) {
        uni.showLoading({ title: '上传图片中...' })
        uploadedImages = await uploadImages()
      }
      await goodsApi.updateGoods(editId.value, {
        title: form.title.trim(),
        description: form.description.trim(),
        condition: form.condition,
        category: form.category,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        location: form.location,
        contactWechat: form.contactWechat,
        contactPhone: form.contactPhone,
        images: uploadedImages,
      })
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch {
      uni.hideLoading()
      submitting.value = false
    }
    return
  }

  // 新发布模式
  submitting.value = true
  uni.showLoading({ title: '发布中...' })

  try {
    let uploadedImages: string[] = []
    if (images.value.length > 0) {
      uni.showLoading({ title: '上传图片中...' })
      uploadedImages = await uploadImages()
    }

    uni.showLoading({ title: '发布中...' })

    if (type.value === 'goods') {
      await goodsApi.publish({
        title: form.title.trim(),
        description: form.description.trim(),
        condition: form.condition,
        category: form.category,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        location: form.location,
        contactWechat: form.contactWechat,
        contactPhone: form.contactPhone,
        images: uploadedImages,
      })
    } else {
      const deadline = `${datePart.value}T${timePart.value}:00`
      await groupbuyApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        groupPrice: Number(form.price),
        targetCount: form.targetCount,
        deadline,
        images: uploadedImages,
        category: form.category,
        contactWechat: form.contactWechat,
        contactPhone: form.contactPhone,
      })
    }

    uni.hideLoading()
    uni.showToast({ title: type.value === 'group' ? '拼团发起成功' : '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.hideLoading()
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await locationApi.getList()
    locations.value = data.locations || []
  } catch {}
})

// 编辑模式加载
onLoad(async (options: any) => {
  if (options?.editId) {
    editId.value = options.editId
    try {
      const res = await goodsApi.getDetail(options.editId)
      const good = Array.isArray(res) ? res[0] : res
      form.title = good.title || ''
      form.description = good.description || ''
      form.condition = good.condition || '9成新'
      form.category = good.category || '其他'
      form.price = String(good.price || '')
      form.originalPrice = good.originalPrice ? String(good.originalPrice) : ''
      form.location = good.location || ''
      form.contactWechat = good.contactWechat || ''
      form.contactPhone = good.contactPhone || ''
      images.value = good.images || []
    } catch {}
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
$error: #c0392b;
$radius: 16rpx;

.page { min-height: 100vh; background: $bg; display: flex; flex-direction: column; overflow-x: hidden; }
.nav-bar {
  height: 88rpx; display: flex; align-items: center; justify-content: center;
  padding: 0 32rpx; border-bottom: 2rpx solid $border;
}
.nav-title { font-size: 32rpx; font-weight: 600; }

.form-scroll { flex: 1; }

.type-tabs {
  display: flex; padding: 24rpx 24rpx; gap: 16rpx;
}
.type-tab {
  flex: 1; padding: 20rpx; text-align: center; border-radius: $radius;
  font-size: 28rpx; font-weight: 500; background: $surface; color: $text-secondary;
  border: 2rpx solid transparent;
  &.active { border-color: $text; color: $text; font-weight: 600; background: $bg; }
}

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

.number-picker { display: flex; align-items: center; gap: 24rpx; }
.picker-btn {
  width: 72rpx; height: 72rpx; border: 2rpx solid $border; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: $text; font-weight: 600; background: $surface;
}
.picker-value { font-size: 32rpx; font-weight: 600; color: $text; min-width: 80rpx; text-align: center; }

.datetime-row { display: flex; gap: 16rpx; }
.picker-field {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius; box-sizing: border-box;
}
.picker-text { font-size: 28rpx; color: $text; &.placeholder { color: $text-tertiary; } }
.arrow { color: $text-tertiary; font-size: 28rpx; }

.location-picker {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx; border: 2rpx solid $border; border-radius: $radius;
  box-sizing: border-box;
}
.location-text { font-size: 28rpx; color: $text; &.placeholder { color: $text-tertiary; } }

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
