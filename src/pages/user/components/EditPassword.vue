<script lang="tsx" name="EditPassword" setup>
import { ElMessage } from 'element-plus';
import type { FormRules, FormInstance } from 'element-plus';
import { userResetPasswordPost, userUpdateNamePost } from '@/api/user';

interface IProps {
  value: boolean;
  uid?: string;
  username?: string;
  name?: string;
}

const props = withDefaults(defineProps<IProps>(), {
  value: false,
  uid: '',
  username: '',
  name: ''
});

const emits = defineEmits<{
  (e: 'update:value', item: boolean): void;
  (e: 'ok'): void;
}>();

interface IForm {
  name: string;
  username: string;
  new_password: string;
  new_password_confirmation: string;
}

const loading = ref<boolean>(false);
const formRef = ref<FormInstance>();
const formData = reactive<IForm>({
  name: '',
  username: '',
  new_password: '',
  new_password_confirmation: ''
});

const formRule = reactive<FormRules<IForm>>({
  name: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }
  ],
  new_password: [
    {
      validator: (_rule: any, val: string, cb: any) => {
        if (val && val.length < 6) {
          cb(new Error('密码长度不能少于6位'));
        } else {
          cb();
        }
      },
      trigger: 'blur'
    }
  ],
  new_password_confirmation: [
    {
      validator: (_rule: any, val: string, cb: any) => {
        if (formData.new_password && val !== formData.new_password) {
          cb(new Error('两次密码输入不一致'));
        } else {
          cb();
        }
      },
      trigger: 'blur'
    }
  ]
});

watch(
  () => props.value,
  n => {
    if (n) {
      formData.name = props.name || '';
      formData.username = props.username || '';
      formData.new_password = '';
      formData.new_password_confirmation = '';
      nextTick(() => {
        formRef.value?.clearValidate();
      });
    } else {
      formRef.value?.resetFields();
    }
  }
);

const onClose = () => {
  emits('update:value', false);
};

const handleErr = (err: any, fallback: string) => {
  if (err && err.status == 400) {
    ElMessage.error(err.msg);
  } else {
    ElMessage.error(fallback);
  }
};

const onSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    if (!props.uid) {
      ElMessage.error('用户uid不能为空');
      return;
    }
    const newName = (formData.name || '').trim();
    const nameChanged = newName !== (props.name || '');
    const passwordChanged = !!formData.new_password;

    if (passwordChanged && formData.new_password !== formData.new_password_confirmation) {
      ElMessage.error('两次密码输入不一致');
      return;
    }
    if (!nameChanged && !passwordChanged) {
      ElMessage.info('未修改任何信息');
      return;
    }

    loading.value = true;
    try {
      if (nameChanged) {
        await userUpdateNamePost({ uid: props.uid, name: newName });
      }
      if (passwordChanged) {
        await userResetPasswordPost({
          uid: props.uid,
          new_password: formData.new_password,
          new_password_confirmation: formData.new_password_confirmation
        });
      }
      loading.value = false;
      ElMessage.success('保存成功！');
      emits('ok');
      onClose();
    } catch (err: any) {
      loading.value = false;
      handleErr(err, '保存失败');
    }
  });
};
</script>

<template>
  <el-dialog
    :model-value="value"
    :width="460"
    :align-center="true"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :draggable="true"
    :z-index="99"
    title="修改用户名密码"
    @close="onClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRule" label-width="90px">
      <el-form-item label="昵称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入昵称" :maxlength="20" show-word-limit />
      </el-form-item>
      <el-form-item label="账号">
        <el-input v-model="formData.username" disabled placeholder="账号" />
      </el-form-item>
      <el-form-item label="新密码" prop="new_password">
        <el-input
          v-model="formData.new_password"
          type="password"
          show-password
          placeholder="不修改请留空；或输入至少6位新密码"
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="new_password_confirmation">
        <el-input
          v-model="formData.new_password_confirmation"
          type="password"
          show-password
          placeholder="请再次输入新密码"
          autocomplete="new-password"
        />
      </el-form-item>
      <div class="text-12px text-gray-500 pl-90px">
        提示：密码以加密形式存储，无法显示原密码；仅修改昵称请留空密码字段。
      </div>
    </el-form>
    <template #footer>
      <el-space>
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </el-space>
    </template>
  </el-dialog>
</template>
