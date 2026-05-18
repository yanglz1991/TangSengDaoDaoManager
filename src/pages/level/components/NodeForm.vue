<script lang="ts" setup>
/**
 * 创建/编辑层级 弹窗
 *
 * 同时支持：
 *   - 新增顶级层级（parentNo='', parentName=''）
 *   - 在某层级下新增子层级（parentNo=xxx, parentName=xxx）
 *   - 编辑已有层级（传入 nodeNo，组件内部会拉取详情自动回显）
 */
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { levelNodeAdd, levelNodeGet, levelNodeUpdate, type LevelNodeReq } from '@/api/level';
import UserPicker from './UserPicker.vue';

interface IProps {
  value: boolean;
  /** 编辑模式时传入的 node_no；为空表示新增 */
  nodeNo?: string;
  /** 新增模式下的父层级 */
  parentNo?: string;
  parentName?: string;
}
const props = withDefaults(defineProps<IProps>(), {
  nodeNo: '',
  parentNo: '',
  parentName: ''
});
const emits = defineEmits<{
  (e: 'update:value', v: boolean): void;
  (e: 'ok'): void;
}>();

const formRef = ref<FormInstance>();
const formData = reactive<LevelNodeReq>({
  parent_no: '',
  name: '',
  owner_uid: '',
  invite_code: '',
  default_friend_uids: []
});
const ownerNameMap = ref<Record<string, string>>({});
const friendNameMap = ref<Record<string, string>>({});
const loading = ref(false);

const rules: FormRules<LevelNodeReq> = {
  name: [{ required: true, message: '请输入层级名称', trigger: 'blur' }],
  owner_uid: [{ required: true, message: '请选择层级负责人', trigger: 'change' }],
  invite_code: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 4, max: 32, message: '邀请码长度需在 4-32 之间', trigger: 'blur' }
  ]
};

const isEdit = computed(() => !!props.nodeNo);
const title = computed(() => {
  if (isEdit.value) return '编辑层级';
  if (props.parentNo) return `在「${props.parentName}」下新增层级`;
  return '新增顶级层级';
});

const reset = () => {
  formData.parent_no = props.parentNo || '';
  formData.name = '';
  formData.owner_uid = '';
  formData.invite_code = '';
  formData.default_friend_uids = [];
  ownerNameMap.value = {};
  friendNameMap.value = {};
  formRef.value?.clearValidate();
};

const loadDetail = async () => {
  if (!props.nodeNo) return;
  loading.value = true;
  try {
    const detail: any = await levelNodeGet(props.nodeNo);
    formData.parent_no = detail.parent_no || '';
    formData.name = detail.name || '';
    formData.owner_uid = detail.owner_uid || '';
    formData.invite_code = detail.invite_code || '';
    formData.default_friend_uids = (detail.default_friends || []).map((f: any) => f.uid);
    ownerNameMap.value = detail.owner_uid ? { [detail.owner_uid]: detail.owner_name || '' } : {};
    friendNameMap.value = (detail.default_friends || []).reduce((acc: Record<string, string>, cur: any) => {
      acc[cur.uid] = cur.name || '';
      return acc;
    }, {});
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.value,
  v => {
    if (v) {
      reset();
      if (isEdit.value) loadDetail();
    }
  }
);

const onClose = () => emits('update:value', false);

const onSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    const payload: LevelNodeReq = {
      parent_no: formData.parent_no,
      name: formData.name.trim(),
      owner_uid: formData.owner_uid,
      invite_code: formData.invite_code.trim(),
      default_friend_uids: formData.default_friend_uids || []
    };
    loading.value = true;
    try {
      if (isEdit.value) {
        await levelNodeUpdate(props.nodeNo, payload);
        ElMessage.success('修改成功');
      } else {
        await levelNodeAdd(payload);
        ElMessage.success('创建成功');
      }
      emits('ok');
      onClose();
    } catch (err: any) {
      if (err?.status === 400) ElMessage.error(err.msg);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<template>
  <el-dialog :model-value="value" :title="title" width="540px" :close-on-click-modal="false" @close="onClose">
    <el-form ref="formRef" v-loading="loading" :model="formData" :rules="rules" label-width="100px">
      <el-form-item v-if="parentName && !isEdit" label="父层级">
        <el-input :model-value="parentName" disabled />
      </el-form-item>
      <el-form-item label="层级名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入层级名称" maxlength="40" show-word-limit />
      </el-form-item>
      <el-form-item label="层级负责人" prop="owner_uid">
        <UserPicker v-model="formData.owner_uid" :initial-map="ownerNameMap" placeholder="搜索手机号/昵称/uid" />
      </el-form-item>
      <el-form-item label="邀请码" prop="invite_code">
        <el-input v-model="formData.invite_code" placeholder="用户使用此邀请码注册即归入此层级" maxlength="32" show-word-limit />
      </el-form-item>
      <el-form-item label="默认好友">
        <UserPicker
          :model-value="formData.default_friend_uids || []"
          multiple
          :initial-map="friendNameMap"
          @update:model-value="(v: any) => (formData.default_friend_uids = (Array.isArray(v) ? v : [v]) as string[])"
          placeholder="可选；新用户注册后自动加这些人为好友"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
