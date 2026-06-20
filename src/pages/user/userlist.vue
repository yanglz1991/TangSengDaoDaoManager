<template>
  <bd-page class="flex-col">
    <!-- 布局 -->

    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">用户列表</p>
        </div>
        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-16px">
              <el-input
                v-model="queryFrom.keyword"
                placeholder="uid/手机号/用户名/IP/设备"
                clearable
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" @click="getUserList">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loadTable" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" :align="'center'" :fixed="'left'">
            <template #header>
              <i-bd-setting class="cursor-pointer" size="16" />
            </template>
          </el-table-column>
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
    <!-- 发消息 -->
    <bd-send-msg v-model:value="sendValue" v-bind="sendInfo" />
    <!-- 查看设备 -->
    <Devices v-model:value="devicesValue" :uid="devicesUid" />
    <!-- 修改账号密码 -->
    <EditPassword
      v-model:value="editPwdValue"
      :uid="editPwdUser.uid"
      :username="editPwdUser.username"
      :name="editPwdUser.name"
      @ok="getUserList"
    />
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 用户列表
  isAffix: false
</route>

<script lang="tsx" setup>
import { useRouter } from 'vue-router';
import { ElButton, ElSpace, ElSwitch, ElAvatar, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage, ElMessageBox } from 'element-plus';
import Devices from '@/pages/message/components/Devices.vue';
import EditPassword from '@/pages/user/components/EditPassword.vue';
import { useUserStore } from '@/stores/modules/user';
import { BU_DOU_CONFIG } from '@/config';
// API 接口
import { userListGet, userLiftbanPut } from '@/api/user';
// 「加人/建群权限」单切换：复用 level 模块的 PUT /manager/level/user/permission
import { levelUserPermissionPut } from '@/api/level';

const router = useRouter();
const userStore = useUserStore();
/**
 * 表格
 */
const column = reactive<Column.ColumnOptions[]>([
  {
    prop: 'name',
    label: '昵称',
    fixed: 'left',
    width: 140
  },
  {
    prop: 'phone',
    label: '手机号',
    fixed: 'left',
    width: 120
  },
  {
    prop: 'username',
    label: '用户',
    width: 160
  },
  {
    prop: 'avatar',
    label: '头像',
    align: 'center',
    width: 80,
    render: (scope: any) => {
      let img_url = '';
      if (scope.row['uid']) {
        img_url = `${BU_DOU_CONFIG.APP_URL}users/${scope.row['uid']}/avatar`;
      }
      return (
        <ElAvatar src={img_url} size={54}>
          {scope.row['name']}
        </ElAvatar>
      );
    }
  },
  // {
  //   prop: 'uid',
  //   label: '用户ID',
  //   minWidth: 300
  // },
  {
    prop: 'status',
    label: '用户状态',
    width: 86,
    formatter(row: any) {
      return row.status === 1 ? '正常' : '封禁';
    }
  },
  {
    prop: 'short_no',
    label: '禧语号',
    width: 120
  },
  {
    prop: 'sex',
    label: '性别',
    width: 60,
    formatter(row: any) {
      return row.sex === 1 ? '男' : '女';
    }
  },
  {
    prop: 'can_invite_or_create_group',
    label: '加人/建群权限',
    width: 130,
    align: 'center',
    render: (scope: any) => {
      const row = scope.row;
      // 失败回滚：服务端返回 4xx 时 ElSwitch 视觉上自动跟随 model-value 不变（受控）。
      const onChange = async (v: any) => {
        const next = v ? 1 : 0;
        const prev = row.can_invite_or_create_group;
        row.can_invite_or_create_group = next; // 乐观更新
        try {
          await levelUserPermissionPut({ uid: row.uid, can_invite_or_create_group: next });
          ElMessage.success(next === 1 ? '已开启加人/建群权限' : '已关闭加人/建群权限');
        } catch (err: any) {
          row.can_invite_or_create_group = prev; // 回滚
          if (err?.status === 400) ElMessage.error(err.msg);
        }
      };
      return (
        <ElSwitch
          model-value={row.can_invite_or_create_group === 1}
          onChange={onChange}
        />
      );
    }
  },
  {
    prop: 'register_time',
    label: '注册时间',
    width: 170
  },
  {
    prop: 'device_name',
    label: '登录设备',
    width: 140
  },
  {
    prop: 'device_model',
    label: '登录设备型号',
    width: 140
  },
  {
    prop: 'last_login_ip',
    label: '登录IP',
    width: 140
  },
  {
    prop: 'online',
    label: '在线状态',
    width: 90,
    formatter(row: any) {
      return row.online === 1 ? '在线' : '离线';
    }
  },
  {
    prop: 'last_online_time',
    label: '最后离线时间',
    width: 150
  },
  {
    prop: 'operation',
    label: '操作',
    align: 'center',
    fixed: 'right',
    width: 180,
    render: (scope: any) => {
      return (
        <ElSpace>
          <ElButton type="primary" onClick={() => onSand(scope.row)}>
            发消息
          </ElButton>
          <ElDropdown
            v-slots={{
              default: () => <ElButton class={'bu-button'}>更多</ElButton>,
              dropdown: () => {
                return (
                  <ElDropdownMenu>
                    <ElDropdownItem onClick={() => onFriends(scope.row)}>
                      <i-bd-every-user class={'mr-4px'} />
                      好友列表
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onUseBlackList(scope.row)}>
                      <i-bd-personal-privacy class={'mr-4px'} />
                      黑名单列表
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onUseLiftban(scope.row)}>
                      <i-bd-info class={'mr-4px'} />
                      {scope.row.status === 1 ? '封禁' : '解禁'}
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onDevices(scope.row)}>
                      <i-bd-devices class={'mr-4px'} />
                      查看设备
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onEditPassword(scope.row)}>
                      <i-bd-info class={'mr-4px'} />
                      修改用户名密码
                    </ElDropdownItem>
                  </ElDropdownMenu>
                );
              }
            }}
          />
        </ElSpace>
      );
    }
  }
]);
const tableData = ref<any[]>([]);
const loadTable = ref<boolean>(false);
// 分页
const total = ref(0);

// 查询
const queryFrom = reactive({
  keyword: '',
  page_size: 15,
  page_index: 1
});

const getUserList = () => {
  loadTable.value = true;
  userListGet(queryFrom).then((res: any) => {
    loadTable.value = false;
    // 先清空再 nextTick 赋值，强制 el-table 重新渲染：
    // 否则当返回数据条数与原数据相同时，element-plus 按 index 复用 row 实例，
    // 单元格内的 {{ scope.row.name }} 偶发不更新（修改昵称后必须 F5 才看到新值的根因）。
    tableData.value = [];
    total.value = res.count;
    nextTick(() => {
      tableData.value = res.list || [];
    });
  });
};

// 分页page-size
const onSizeChange = (size: number) => {
  queryFrom.page_size = size;
  getUserList();
};

// 分页page-size
const onCurrentChange = (current: number) => {
  queryFrom.page_index = current;
  getUserList();
};

// 发送信息
const sendValue = ref<boolean>(false);
const sendInfo = ref({
  receivederChannelType: 1,
  receiveder: '',
  receivederName: '',
  sender: '',
  senderName: ''
});
const onSand = (item: any) => {
  sendValue.value = true;
  sendInfo.value = {
    receivederChannelType: 1,
    receiveder: item.uid,
    receivederName: item.name,
    sender: userStore.userInfo.uid,
    senderName: userStore.userInfo.name
  };
};

// 好友列表
const onFriends = (item: any) => {
  router.push({
    path: '/user/friends',
    query: {
      uid: item.uid,
      name: item.name
    }
  });
};

// 黑名单列表
const onUseBlackList = (item: any) => {
  router.push({
    path: '/user/userblacklist',
    query: {
      uid: item.uid,
      name: item.name
    }
  });
};

// 用户封禁/解封操作
const onUseLiftban = (item: any) => {
  const text = item.status == 1 ? '封禁' : '解禁';
  ElMessageBox.confirm(`确定要${text}用户${item.name} 吗`, `${text}用户`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning'
  })
    .then(() => {
      const fromLiftban = {
        uid: item.uid,
        status: item.status == 1 ? 0 : 1
      };
      userLiftbanPut(fromLiftban)
        .then((_res: any) => {
          getUserList();
          ElMessage({
            type: 'success',
            message: `${text}用户成功！`
          });
        })
        .catch(err => {
          if (err.status == 400) {
            ElMessage.error(err.msg);
          }
        });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消成功！'
      });
    });
};

// 查看设备
const devicesValue = ref(false);
const devicesUid = ref('');

const onDevices = (item: any) => {
  devicesUid.value = item.uid;
  devicesValue.value = true;
};

// 修改账号密码
const editPwdValue = ref(false);
const editPwdUser = reactive({
  uid: '',
  username: '',
  name: ''
});

const onEditPassword = (item: any) => {
  editPwdUser.uid = item.uid;
  editPwdUser.username = item.username || '';
  editPwdUser.name = item.name || '';
  editPwdValue.value = true;
};

// 初始化
onMounted(() => {
  getUserList();
});
</script>

<style lang="scss" scoped>
// 样式
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
