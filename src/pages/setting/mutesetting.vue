<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">禁言设置</p>
        </div>
        <div class="flex items-center h-50px"></div>
      </div>

      <div class="flex-1 overflow-hidden p-12px">
        <div class="h-full overflow-auto">
          <div class="w-640px">
            <el-form :model="formData" label-width="180px">
              <el-divider content-position="left">群聊禁言</el-divider>
              <el-form-item label="开启群聊禁言：">
                <el-switch v-model="formData.disable_group_message_on" :active-value="1" :inactive-value="0" />
                <span class="ml-12px text-12px text-gray-500">
                  开启后：所有用户禁止群发消息、禁止建群、禁止加群成员、禁止添加好友。
                </span>
              </el-form-item>
              <el-form-item label="群聊禁言提示文案：">
                <el-input
                  v-model="formData.mute_text_of_group"
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  type="textarea"
                  maxlength="200"
                  show-word-limit
                  placeholder="例如：夜间禁言中，请稍后再发"
                />
              </el-form-item>

              <el-divider content-position="left">私聊禁言</el-divider>
              <el-form-item label="开启私聊禁言：">
                <el-switch v-model="formData.disable_private_message_on" :active-value="1" :inactive-value="0" />
                <span class="ml-12px text-12px text-gray-500">开启后：所有用户禁止发送私聊消息。</span>
              </el-form-item>
              <el-form-item label="私聊禁言提示文案：">
                <el-input
                  v-model="formData.mute_text_of_private"
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  type="textarea"
                  maxlength="200"
                  show-word-limit
                  placeholder="例如：休息禁言中，暂时无法发送消息"
                />
              </el-form-item>

              <el-form-item>
                <el-button :loading="saving" class="!w-100%" type="primary" @click="onSaveClick">保存</el-button>
              </el-form-item>
              <div class="text-12px text-gray-500 pl-180px">
                提示：Web 端不受此设置限制；移动端会在打开聊天页时根据开关与文案显示并禁用发送。
              </div>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 禁言设置
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { getAppconfigGet, updateAppconfigPost } from '@/api/setting';

interface IForm {
  disable_group_message_on: number;
  disable_private_message_on: number;
  mute_text_of_group: string;
  mute_text_of_private: string;
  // 后端 update 接口是整张 app_config 的覆盖式更新，回填其他字段避免被清空
  revoke_second?: number;
  welcome_message?: string;
  new_user_join_system_group?: number;
  search_by_phone?: number;
  send_welcome_message_on?: number;
  register_invite_on?: number;
  invite_system_account_join_group_on?: number;
  register_user_must_complete_info_on?: number;
  channel_pinned_message_max_count?: number;
  can_modify_api_url?: number;
}

const formData = reactive<IForm>({
  disable_group_message_on: 0,
  disable_private_message_on: 0,
  mute_text_of_group: '',
  mute_text_of_private: ''
});

const saving = ref(false);

const initData = () => {
  getAppconfigGet().then((res: any) => {
    formData.disable_group_message_on = res.disable_group_message_on ?? 0;
    formData.disable_private_message_on = res.disable_private_message_on ?? 0;
    formData.mute_text_of_group = res.mute_text_of_group ?? '';
    formData.mute_text_of_private = res.mute_text_of_private ?? '';
    // 回填其它字段，保存时一并提交，避免覆盖丢失
    formData.revoke_second = res.revoke_second;
    formData.welcome_message = res.welcome_message;
    formData.new_user_join_system_group = res.new_user_join_system_group;
    formData.search_by_phone = res.search_by_phone;
    formData.send_welcome_message_on = res.send_welcome_message_on;
    formData.register_invite_on = res.register_invite_on;
    formData.invite_system_account_join_group_on = res.invite_system_account_join_group_on;
    formData.register_user_must_complete_info_on = res.register_user_must_complete_info_on;
    formData.channel_pinned_message_max_count = res.channel_pinned_message_max_count;
    formData.can_modify_api_url = res.can_modify_api_url;
  });
};

const onSaveClick = () => {
  if (formData.disable_group_message_on === 1 && !formData.mute_text_of_group.trim()) {
    ElMessage.warning('请填写群聊禁言提示文案');
    return;
  }
  if (formData.disable_private_message_on === 1 && !formData.mute_text_of_private.trim()) {
    ElMessage.warning('请填写私聊禁言提示文案');
    return;
  }
  saving.value = true;
  updateAppconfigPost(formData)
    .then(() => {
      saving.value = false;
      ElMessage.success('保存成功');
    })
    .catch(err => {
      saving.value = false;
      if (err && err.status == 400) {
        ElMessage.error(err.msg);
      } else {
        ElMessage.error('保存失败');
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
