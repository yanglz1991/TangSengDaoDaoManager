<script lang="ts" setup>
/**
 * 移动用户到指定层级 弹窗
 *
 * 仅展示一个层级树（来自 /manager/level/tree），选择目标节点后调用 levelUserMovePut
 *
 * 关键点：当用户层级变化时，后端会：
 *   1) 与旧层级 default_friend 解除好友关系
 *   2) 与新层级 default_friend 建立好友关系
 */
import { ElMessage } from 'element-plus';
import { levelTreeGet, levelUserMovePut, type LevelNode } from '@/api/level';

interface IProps {
  value: boolean;
  uid: string;
  userName: string;
  currentNodeNo: string;
}

const props = withDefaults(defineProps<IProps>(), {
  value: false,
  uid: '',
  userName: '',
  currentNodeNo: ''
});
const emits = defineEmits<{
  (e: 'update:value', v: boolean): void;
  (e: 'ok'): void;
}>();

const loading = ref(false);
const treeData = ref<any[]>([]);
const targetNodeNo = ref<string>('');

interface TreeNode {
  node_no: string;
  name: string;
  parent_no: string;
  children: TreeNode[];
}

const buildTree = (list: LevelNode[]): TreeNode[] => {
  const map = new Map<string, TreeNode>();
  list.forEach(n => map.set(n.node_no, { node_no: n.node_no, name: n.name, parent_no: n.parent_no, children: [] }));
  const roots: TreeNode[] = [];
  list.forEach(n => {
    const node = map.get(n.node_no)!;
    if (!n.parent_no) roots.push(node);
    else map.get(n.parent_no)?.children.push(node);
  });
  return roots;
};

const loadTree = async () => {
  loading.value = true;
  try {
    const res: any = await levelTreeGet();
    treeData.value = buildTree((res || []) as LevelNode[]);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.value,
  v => {
    if (v) {
      targetNodeNo.value = '';
      loadTree();
    }
  }
);

const onClose = () => emits('update:value', false);

const onSubmit = async () => {
  if (!targetNodeNo.value) {
    ElMessage.warning('请选择目标层级');
    return;
  }
  if (targetNodeNo.value === props.currentNodeNo) {
    ElMessage.info('用户已在此层级');
    return;
  }
  loading.value = true;
  try {
    await levelUserMovePut({ uid: props.uid, node_no: targetNodeNo.value });
    ElMessage.success('移动成功');
    emits('ok');
    onClose();
  } catch (err: any) {
    if (err?.status === 400) ElMessage.error(err.msg);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog :model-value="value" title="移动用户到指定层级" width="480px" :close-on-click-modal="false" @close="onClose">
    <p class="m-0 mb-12px text-14px text-#666">
      用户：<span class="font-600">{{ userName }}</span>
    </p>
    <p class="m-0 mb-12px text-12px text-#999">移动后会自动解除原层级默认好友关系，并加入新层级默认好友为好友。</p>
    <el-tree
      v-loading="loading"
      :data="treeData"
      node-key="node_no"
      :props="{ label: 'name', children: 'children' }"
      :default-expand-all="true"
      :highlight-current="true"
      @node-click="(d: any) => (targetNodeNo = d.node_no)"
    />
    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="!targetNodeNo" @click="onSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
