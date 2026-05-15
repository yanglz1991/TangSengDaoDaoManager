<script lang="ts" setup>
/**
 * 向指定层级批量添加成员
 *
 * 实现：复用 PUT /manager/level/user/move 接口（即移动用户到该层级）。
 *   服务端内部已经处理了：
 *     - 用户原本无层级 → 仅加新层级默认好友
 *     - 用户原本属于其它层级 → 先解除旧层级默认好友，再加新层级默认好友
 *     - 用户已在该层级 → 直接返回 OK，幂等
 *
 * 前端做的事：并发调用 N 次接口，统计成功/失败数。
 */
import { ElMessage } from 'element-plus';
import { levelUserMovePut } from '@/api/level';
import UserPicker from './UserPicker.vue';

interface IProps {
  value: boolean;
  nodeNo: string;
  nodeName: string;
}

const props = defineProps<IProps>();
const emits = defineEmits<{
  (e: 'update:value', v: boolean): void;
  (e: 'ok'): void;
}>();

const loading = ref(false);
const uids = ref<string[]>([]);
// 「加人/建群权限」开关：默认关闭，提交时一并下发到服务端
const canInviteOrCreateGroup = ref(false);

watch(
  () => props.value,
  v => {
    if (v) {
      uids.value = [];
      canInviteOrCreateGroup.value = false;
    }
  }
);

const onClose = () => emits('update:value', false);

const onSubmit = async () => {
  if (!uids.value.length) {
    ElMessage.warning('请至少选择一个用户');
    return;
  }
  loading.value = true;
  try {
    const permVal = canInviteOrCreateGroup.value ? 1 : 0;
    const results = await Promise.allSettled(
      uids.value.map(uid =>
        levelUserMovePut({
          uid,
          node_no: props.nodeNo,
          can_invite_or_create_group: permVal
        })
      )
    );
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.length - successCount;
    if (failCount === 0) {
      ElMessage.success(`已添加 ${successCount} 个成员到「${props.nodeName}」`);
    } else {
      // 拿第一个失败原因展示，便于排查（例如 layer 不存在 / 用户不存在）
      const firstErr = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
      const reason = firstErr?.reason?.msg || '部分用户处理失败';
      ElMessage.warning(`成功 ${successCount} 个，失败 ${failCount} 个：${reason}`);
    }
    emits('ok');
    onClose();
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog
    :model-value="value"
    :title="`向「${nodeName}」添加成员`"
    width="540px"
    :close-on-click-modal="false"
    @close="onClose"
  >
    <p class="text-12px text-#999 m-0 mb-12px leading-20px">
      所选用户将被加入「{{ nodeName }}」层级。<br />
      若用户原本属于其它层级，会自动从原层级移出，解除原层级的默认好友，再加入本层级的默认好友。
    </p>
    <UserPicker
      :model-value="uids"
      multiple
      placeholder="搜索手机号 / 昵称 / uid，可多选"
      @update:model-value="(v: any) => (uids = (Array.isArray(v) ? v : [v]) as string[])"
    />
    <div class="flex items-center mt-16px">
      <span class="text-14px mr-12px">加人/建群权限：</span>
      <el-switch v-model="canInviteOrCreateGroup" />
      <span class="text-12px text-#999 ml-8px">
        {{ canInviteOrCreateGroup ? '开启（允许主动加好友、创建群聊）' : '关闭（仅可被动接受）' }}
      </span>
    </div>
    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="!uids.length" @click="onSubmit">
        确定添加
      </el-button>
    </template>
  </el-dialog>
</template>
