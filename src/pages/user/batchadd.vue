<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">批量生成账户</p>
        </div>
        <div class="flex items-center h-50px"></div>
      </div>
      <div class="flex-1 overflow-auto p-16px">
        <div class="w-560px">
          <el-alert
            class="!mb-16px"
            type="info"
            :closable="false"
            show-icon
            title="按起始手机号顺序递增生成。例如：起始手机号 15500000000、生成 100 个 → 15500000000~15500000099。已存在的手机号会跳过。生成的账号默认昵称与登录密码均为对应手机号本身。"
          />
          <el-form :model="formData" label-width="160px">
            <el-form-item label="区号：">
              <el-select v-model="formData.zone" class="!w-100%">
                <el-option label="0086" value="0086" />
              </el-select>
            </el-form-item>
            <el-form-item label="起始手机号：" required>
              <el-input
                v-model="formData.start_phone"
                placeholder="请输入 11 位起始手机号，例如 15500000000"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item label="生成数量：" required>
              <el-input-number
                v-model="formData.count"
                :min="1"
                :max="1000"
                step-strictly
                class="!w-200px"
              />
              <span class="text-gray-400 ml-12px">单次最多 1000 个</span>
            </el-form-item>
            <el-form-item label="性别：">
              <el-radio-group v-model="formData.sex">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="0">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="登录密码：">
              <el-input
                v-model="formData.password"
                placeholder="留空则使用各账号自身手机号作为密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="加人/建群权限：">
              <el-checkbox v-model="canInviteOrCreateGroup">
                开启 - 允许这些账号主动加好友 / 创建群聊
              </el-checkbox>
              <div class="text-gray-400 text-12px">
                关闭：默认无加人 / 建群权限（与手机号注册的普通用户一致）
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                :loading="submitLoading"
                class="!w-100%"
                type="primary"
                @click="onSubmit"
              >
                开始生成
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 结果展示 -->
          <div v-if="result" class="mt-24px">
            <el-divider>生成结果</el-divider>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="计划数量">{{ result.total }}</el-descriptions-item>
              <el-descriptions-item label="成功">
                <span class="text-green-600 font-600">{{ result.success }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="跳过">
                <span class="text-orange-500 font-600">{{ result.skipped?.length || 0 }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="失败">
                <span class="text-red-500 font-600">{{ result.failed?.length || 0 }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-collapse v-if="result.skipped?.length || result.failed?.length" class="mt-12px">
              <el-collapse-item v-if="result.skipped?.length" title="跳过的手机号">
                <el-table :data="result.skipped" size="small" border>
                  <el-table-column prop="phone" label="手机号" min-width="160" />
                  <el-table-column prop="reason" label="原因" />
                </el-table>
              </el-collapse-item>
              <el-collapse-item v-if="result.failed?.length" title="失败的手机号">
                <el-table :data="result.failed" size="small" border>
                  <el-table-column prop="phone" label="手机号" min-width="160" />
                  <el-table-column prop="reason" label="原因" />
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 批量生成账户
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { userBatchAddPost } from '@/api/user';

interface BatchItem {
  phone: string;
  reason?: string;
  uid?: string;
}
interface BatchResult {
  total: number;
  success: number;
  skipped: BatchItem[];
  failed: BatchItem[];
  items: BatchItem[];
}

const formData = reactive({
  zone: '0086',
  start_phone: '',
  count: 100,
  sex: 1,
  password: ''
});
const canInviteOrCreateGroup = ref(false);

const submitLoading = ref(false);
const result = ref<BatchResult | null>(null);

const onSubmit = () => {
  // 简单前端校验，详细校验由服务端兜底
  const phone = (formData.start_phone || '').trim();
  if (!/^\d{11}$/.test(phone)) {
    ElMessage.error('起始手机号必须是 11 位数字');
    return;
  }
  if (!formData.count || formData.count <= 0 || formData.count > 1000) {
    ElMessage.error('生成数量必须在 1~1000 之间');
    return;
  }

  submitLoading.value = true;
  userBatchAddPost({
    start_phone: phone,
    count: formData.count,
    zone: formData.zone,
    sex: formData.sex,
    password: formData.password,
    can_invite_or_create_group: canInviteOrCreateGroup.value ? 1 : 0
  })
    .then((res: any) => {
      submitLoading.value = false;
      result.value = res as BatchResult;
      const success = result.value?.success ?? 0;
      const skipped = result.value?.skipped?.length ?? 0;
      const failed = result.value?.failed?.length ?? 0;
      ElMessage.success(`生成完成：成功 ${success}，跳过 ${skipped}，失败 ${failed}`);
    })
    .catch(err => {
      submitLoading.value = false;
      if (err?.status === 400) {
        ElMessage.error(err.msg);
      } else {
        ElMessage.error('生成失败，请稍后重试');
      }
    });
};
</script>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
