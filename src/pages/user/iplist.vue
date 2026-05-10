<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">IP 列表</p>
        </div>
        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-16px">
              <el-input
                v-model="queryFrom.keyword"
                placeholder="IP / 用户uid / 用户昵称"
                clearable
                style="width: 260px"
                @keyup.enter="onSearch"
              />
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" @click="onSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loadTable" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" :align="'center'" :fixed="'left'" />
          <el-table-column v-for="item in column" v-bind="item" :key="item.prop">
            <template #default="scope">
              <template v-if="item.render">
                <component :is="item.render" :row="scope.row"> </component>
              </template>
              <template v-else-if="item.formatter">
                <slot :name="item.prop" :row="scope.row">{{ item.formatter(scope.row) }}</slot>
              </template>
              <template v-else-if="item.prop">
                <slot :name="item.prop" :row="scope.row">{{ scope.row[item.prop!] }}</slot>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
        <div></div>
        <el-pagination
          v-model:current-page="queryFrom.page_index"
          v-model:page-size="queryFrom.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onCurrentChange"
        />
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: IP 列表
  isAffix: false
</route>

<script lang="tsx" setup>
import { ElButton, ElSpace, ElTag, ElMessage, ElMessageBox } from 'element-plus';
import { userIpListGet, userIpBlacklistAddPost, userIpBlacklistRemovePost } from '@/api/user';

/** 表格列定义 */
const column = reactive<Column.ColumnOptions[]>([
  {
    prop: 'login_ip',
    label: 'IP',
    fixed: 'left',
    width: 160
  },
  {
    prop: 'is_banned',
    label: '封禁状态',
    width: 100,
    align: 'center',
    render: (scope: any) => {
      return scope.row.is_banned === 1 ? <ElTag type="danger">已封禁</ElTag> : <ElTag type="success">正常</ElTag>;
    }
  },
  {
    prop: 'name',
    label: '关联用户昵称',
    width: 140
  },
  {
    prop: 'username',
    label: '关联用户名',
    width: 140
  },
  {
    prop: 'uid',
    label: '关联用户UID',
    minWidth: 240
  },
  {
    prop: 'user_status',
    label: '用户状态',
    width: 90,
    formatter(row: any) {
      return row.user_status === 1 ? '正常' : '封禁';
    }
  },
  {
    prop: 'last_login_time',
    label: '最近登录时间',
    width: 160
  },
  {
    prop: 'banned_at',
    label: '封禁时间',
    width: 160
  },
  {
    prop: 'ban_reason',
    label: '封禁原因',
    minWidth: 160
  },
  {
    prop: 'operation',
    label: '操作',
    align: 'center',
    fixed: 'right',
    width: 110,
    render: (scope: any) => {
      const banned = scope.row.is_banned === 1;
      return (
        <ElSpace>
          <ElButton type={banned ? 'success' : 'danger'} onClick={() => onToggleBan(scope.row)}>
            {banned ? '解禁' : '封禁'}
          </ElButton>
        </ElSpace>
      );
    }
  }
]);

const tableData = ref<any[]>([]);
const loadTable = ref(false);
const total = ref(0);

const queryFrom = reactive({
  keyword: '',
  page_size: 15,
  page_index: 1
});

const getList = () => {
  loadTable.value = true;
  userIpListGet(queryFrom)
    .then((res: any) => {
      loadTable.value = false;
      tableData.value = [];
      total.value = res.count || 0;
      nextTick(() => {
        tableData.value = res.list || [];
      });
    })
    .catch(() => {
      loadTable.value = false;
    });
};

const onSearch = () => {
  queryFrom.page_index = 1;
  getList();
};

const onSizeChange = (size: number) => {
  queryFrom.page_size = size;
  getList();
};
const onCurrentChange = (current: number) => {
  queryFrom.page_index = current;
  getList();
};

// 封禁 / 解禁切换
const onToggleBan = (row: any) => {
  const banned = row.is_banned === 1;
  if (banned) {
    ElMessageBox.confirm(`确定要解禁 IP ${row.login_ip} 吗？`, '解禁 IP', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false
    })
      .then(() => {
        userIpBlacklistRemovePost({ ip: row.login_ip })
          .then(() => {
            ElMessage.success('解禁成功');
            getList();
          })
          .catch((err: any) => {
            ElMessage.error(err?.msg || '解禁失败');
          });
      })
      .catch(() => {});
  } else {
    ElMessageBox.prompt(`请输入封禁 IP ${row.login_ip} 的原因（可选）`, '封禁 IP', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：异常登录 / 恶意刷接口 等',
      closeOnClickModal: false,
      inputValidator: () => true
    })
      .then(({ value }: any) => {
        userIpBlacklistAddPost({ ip: row.login_ip, reason: value || '' })
          .then(() => {
            ElMessage.success('封禁成功');
            getList();
          })
          .catch((err: any) => {
            ElMessage.error(err?.msg || '封禁失败');
          });
      })
      .catch(() => {});
  }
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
