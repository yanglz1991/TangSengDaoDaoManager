<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">加密通道管理</p>
        </div>
        <div class="flex items-center h-50px"></div>
      </div>

      <div class="flex-1 overflow-hidden p-12px">
        <div class="h-full overflow-auto">
          <div class="w-540px">
            <el-alert
              class="mb-12px"
              type="info"
              :closable="false"
              show-icon
              title="启用后,App「我的-设置-通用」中会出现一个按钮,用户输入正确密码后可通过 WebView 打开你配置的 H5 页面;打开过一次后该设备免密。"
            />
            <el-form :model="formData" label-width="120px">
              <el-form-item label="启用状态：">
                <el-radio-group v-model="formData.enabled">
                  <el-radio :label="1">启用</el-radio>
                  <el-radio :label="0">停用</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="按钮名称：">
                <el-input
                  v-model="formData.name"
                  placeholder="例如: 公司专属频道"
                  maxlength="40"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="H5 链接：">
                <el-input
                  v-model="formData.url"
                  placeholder="https://"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="访问密码：">
                <el-input
                  v-model="formData.password"
                  placeholder="用户首次进入时需输入的密码"
                  maxlength="40"
                  show-word-limit
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button :loading="saving" class="!w-100%" type="primary" @click="onSaveClick">保存</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 加密通道管理
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { getSecureChannelGet, updateSecureChannelPut } from '@/api/setting';

const formData = reactive({
  name: '',
  url: '',
  password: '',
  enabled: 0
});

const initData = () => {
  getSecureChannelGet().then((res: any) => {
    formData.name = res?.name ?? '';
    formData.url = res?.url ?? '';
    formData.password = res?.password ?? '';
    formData.enabled = res?.enabled ?? 0;
  });
};

const saving = ref(false);
const onSaveClick = () => {
  if (formData.enabled === 1) {
    if (!formData.name.trim()) {
      ElMessage.error('请填写按钮名称');
      return;
    }
    if (!formData.url.trim()) {
      ElMessage.error('请填写 H5 链接');
      return;
    }
    if (!formData.password.trim()) {
      ElMessage.error('请填写访问密码');
      return;
    }
  }
  saving.value = true;
  updateSecureChannelPut(formData)
    .then(() => {
      saving.value = false;
      ElMessage.success('保存成功');
    })
    .catch((err: any) => {
      saving.value = false;
      if (err?.status == 400) {
        ElMessage.error(err.msg);
      }
    });
};

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
