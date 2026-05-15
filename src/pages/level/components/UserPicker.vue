<script lang="ts" setup>
/**
 * 用户选择器
 *   - multiple=false：单选返回 string（uid），用于「层级负责人」
 *   - multiple=true ：多选返回 string[]（uid 数组），用于「默认好友」「移动用户」
 *
 * 通过远程搜索 /manager/level/users/search，已支持空 keyword 默认列表（按注册时间倒序）。
 */
import { levelUsersSearchGet, type LevelUser } from '@/api/level';

interface IProps {
  modelValue: string | string[];
  multiple?: boolean;
  placeholder?: string;
  /** 排除的 uid 列表（如选默认好友时排除负责人本身） */
  excludeUids?: string[];
  /** 初始已选用户的展示名映射（避免编辑回显时只看到 uid） */
  initialMap?: Record<string, string>;
}

const props = withDefaults(defineProps<IProps>(), {
  multiple: false,
  placeholder: '请选择用户',
  excludeUids: () => [] as string[],
  initialMap: () => ({})
});
const emit = defineEmits<{
  (e: 'update:modelValue', v: string | string[]): void;
}>();

const loading = ref(false);
const options = ref<{ uid: string; name: string; phone?: string }[]>([]);

const remoteSearch = async (kw: string) => {
  loading.value = true;
  try {
    const res: any = await levelUsersSearchGet({ keyword: kw, limit: 30 });
    const list = (res || []) as LevelUser[];
    options.value = list
      .filter(u => !props.excludeUids.includes(u.uid))
      .map(u => ({
        uid: u.uid,
        name: u.name || u.uid,
        phone: u.phone
      }));
  } finally {
    loading.value = false;
  }
};

// 编辑回显：把 modelValue 中本地不在 options 的 uid 用 initialMap 中的名称占位补一次
const ensureSelectedVisible = () => {
  const selected = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [];
  selected.forEach(uid => {
    if (!options.value.find(o => o.uid === uid)) {
      options.value.unshift({ uid, name: props.initialMap[uid] || uid });
    }
  });
};

watch(
  () => props.modelValue,
  () => ensureSelectedVisible(),
  { immediate: true }
);

onMounted(() => {
  remoteSearch('');
});

const onChange = (v: any) => emit('update:modelValue', v);
</script>

<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    filterable
    remote
    clearable
    :reserve-keyword="true"
    :remote-method="remoteSearch"
    :loading="loading"
    :placeholder="placeholder"
    style="width: 100%"
    @change="onChange"
  >
    <el-option v-for="o in options" :key="o.uid" :label="o.phone ? `${o.name} (${o.phone})` : o.name" :value="o.uid" />
  </el-select>
</template>
