<template>
  <div class="download-page">
    <div class="download-card">
      <img src="@/assets/logo-budou.png" class="download-logo" />
      <h2 class="download-title">禧语APP下载</h2>
      <p class="download-subtitle">请选择您的设备平台进行下载</p>
      <div class="download-actions">
        <button class="btn btn-android" :disabled="loading" @click="onAndroid">
          <span v-if="loading">获取中...</span>
          <span v-else>Android 下载</span>
        </button>
        <button class="btn btn-ios" @click="onIOS">iOS 下载</button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  title: 应用下载
  layout: false
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { BU_DOU_CONFIG } from '@/config';

const APP_TITLE = BU_DOU_CONFIG.APP_TITLE;
const loading = ref(false);

// ponytail: 硬编码 iOS 企业签地址，如需更换直接改这里
const IOS_URLS = [
  'https://zwrmz.boqiwl.com/TZbffG/DBQpeBpwiwP5a8qr',
  'https://mtqwn.jiamu9.com/TZbffG/DBQpeBpwiwP5a8qr',
  'https://d3exzbexqd1fez.cloudfront.net/37ft56'
];

const onAndroid = async () => {
  loading.value = true;
  try {
    // ponytail: 用 fetch 绕过共享 axios 的 401 拦截器，避免免认证页面被跳转到登录页
    const url = `${BU_DOU_CONFIG.APP_URL}common/appversion/list?page_size=50&page_index=1`;
    const resp = await fetch(url);
    const res: any = await resp.json();
    const list = res.list || [];
    const androidList = list.filter((item: any) => item.os === 'android');
    const latest = androidList[0];
    if (latest?.download_url) {
      const downloadUrl = latest.download_url.startsWith('http')
        ? latest.download_url
        : `${BU_DOU_CONFIG.APP_URL}${latest.download_url}`;
      window.location.href = downloadUrl;
    } else {
      ElMessage.error('暂无安卓版本可下载');
    }
  } catch {
    ElMessage.error('获取版本信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const onIOS = () => {
  window.location.href = IOS_URLS[0];
};
</script>

<style scoped>
.download-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.download-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  width: 360px;
}

.download-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  display: block;
}

.download-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.download-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0 0 32px;
}

.download-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn {
  height: 52px;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  opacity: 0.9;
}

.btn-android {
  background: #07c160;
  color: #fff;
}

.btn-ios {
  background: #1a1a1a;
  color: #fff;
}
</style>
