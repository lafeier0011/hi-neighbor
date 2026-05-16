<template>
  <view class="page">
    <view class="form-section">
      <!-- 昵称 -->
      <view class="form-group">
        <text class="form-label">昵称</text>
        <input
          v-model="form.nickname"
          class="form-input"
          placeholder="输入昵称"
          maxlength="20"
        />
      </view>

      <!-- 社区 -->
      <view class="form-group">
        <text class="form-label">社区</text>
        <picker :range="communityNames" @change="onCommunityChange">
          <view class="form-picker">
            <text :class="{ placeholder: !form.community }">
              {{ form.community || '请选择社区' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 楼栋 -->
      <view class="form-group">
        <text class="form-label">楼栋</text>
        <input
          v-model="form.building"
          class="form-input"
          placeholder="输入楼栋号"
          maxlength="20"
        />
      </view>
    </view>

    <!-- 保存 -->
    <view class="save-btn" :class="{ disabled: saving }" @tap="handleSave">
      <text>{{ saving ? '保存中...' : '保存' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi, locationApi } from '../../api'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

const form = ref({
  nickname: '',
  community: '',
  building: '',
})
const communities = ref<any[]>([])
const communityNames = ref<string[]>([])
const saving = ref(false)

async function fetchLocations() {
  try {
    const res = await locationApi.getList()
    communities.value = res.communities || []
    communityNames.value = communities.value.map((c: any) => c.name)
  } catch {}
}

function onCommunityChange(e: any) {
  const idx = e.detail.value
  if (communityNames.value[idx]) {
    form.value.community = communityNames.value[idx]
  }
}

async function handleSave() {
  if (saving.value) return
  if (!form.value.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await authApi.updateProfile({
      nickname: form.value.nickname.trim(),
      community: form.value.community,
      building: form.value.building.trim(),
    })

    // 更新本地缓存
    const newInfo = {
      ...userStore.userInfo,
      nickname: form.value.nickname.trim(),
      community: form.value.community,
      building: form.value.building.trim(),
    }
    userStore.userInfo = newInfo
    uni.setStorageSync('userInfo', newInfo)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  saving.value = false
}

onMounted(() => {
  const info = userStore.userInfo || {}
  form.value.nickname = info.nickname || ''
  form.value.community = info.community || ''
  form.value.building = info.building || ''
  fetchLocations()
})
</script>

<style scoped lang="scss">
$bg: #ffffff; $surface: #f8f5f1; $border: #ebe4da; $text: #2d2a26;
$text-sec: #6b6b6b; $text-tri: #999; $accent: #c2703e; $radius: 16rpx;

.page { min-height: 100vh; background: $surface; padding: 32rpx; overflow-x: hidden; }

.form-section { background: $bg; border-radius: $radius; border: 2rpx solid $border; overflow: hidden; }
.form-group { padding: 28rpx 32rpx; border-bottom: 2rpx solid $surface;
  &:last-child { border-bottom: none; } }
.form-label { font-size: 26rpx; color: $text-tri; display: block; margin-bottom: 12rpx; }
.form-input { width: 100%; font-size: 30rpx; color: $text; padding: 16rpx 0; border: none; outline: none;
  background: transparent; }

.form-picker { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 0;
  text { font-size: 30rpx; color: $text; }
  .placeholder { color: $text-tri; } }
.picker-arrow { color: $text-tri; font-size: 32rpx; }

.save-btn { margin-top: 48rpx; height: 96rpx; background: $accent; border-radius: $radius;
  display: flex; align-items: center; justify-content: center;
  text { color: #fff; font-size: 32rpx; font-weight: 600; }
  &.disabled { opacity: 0.6; } }
</style>
