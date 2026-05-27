<script lang="tsx" setup>
/**
 * 层级管理
 *   左：层级树（支持新增子层级、编辑、删除）
 *   右：当前选中层级下的用户列表（支持切换加人/建群权限、移动到其它层级）
 */
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  levelTreeGet,
  levelNodeDelete,
  levelNodeUsersGet,
  levelUserPermissionPut,
  levelNodePermissionPut,
  levelUserRemovePut,
  type LevelNode,
  type LevelUser
} from '@/api/level';
import NodeForm from './components/NodeForm.vue';
import MoveUser from './components/MoveUser.vue';
import AddMembers from './components/AddMembers.vue';

interface TreeNode extends LevelNode {
  children: TreeNode[];
}

// ----- 层级树 -----
const treeLoading = ref(false);
const treeData = ref<TreeNode[]>([]);
const flatNodes = ref<LevelNode[]>([]);
const selectedNode = ref<LevelNode | null>(null);

const buildTree = (list: LevelNode[]): TreeNode[] => {
  const map = new Map<string, TreeNode>();
  list.forEach(n => map.set(n.node_no, { ...n, children: [] }));
  const roots: TreeNode[] = [];
  list.forEach(n => {
    const node = map.get(n.node_no)!;
    if (!n.parent_no) roots.push(node);
    else map.get(n.parent_no)?.children.push(node);
  });
  return roots;
};

const loadTree = async (keepSelected = false) => {
  treeLoading.value = true;
  try {
    const res: any = await levelTreeGet();
    flatNodes.value = (res || []) as LevelNode[];
    treeData.value = buildTree(flatNodes.value);
    if (keepSelected && selectedNode.value) {
      const fresh = flatNodes.value.find(n => n.node_no === selectedNode.value!.node_no);
      selectedNode.value = fresh || null;
      if (fresh) loadUsers();
      else userList.value = [];
    }
  } finally {
    treeLoading.value = false;
  }
};

const onTreeNodeClick = (data: TreeNode) => {
  selectedNode.value = data;
  queryFrom.page_index = 1;
  loadUsers();
};

// ----- 节点新增/编辑 -----
const nodeFormVisible = ref(false);
const nodeFormState = reactive({
  nodeNo: '',
  parentNo: '',
  parentName: ''
});

const onAddRoot = () => {
  nodeFormState.nodeNo = '';
  nodeFormState.parentNo = '';
  nodeFormState.parentName = '';
  nodeFormVisible.value = true;
};
const onAddChild = (node: LevelNode) => {
  nodeFormState.nodeNo = '';
  nodeFormState.parentNo = node.node_no;
  nodeFormState.parentName = node.name;
  nodeFormVisible.value = true;
};
const onEditNode = (node: LevelNode) => {
  nodeFormState.nodeNo = node.node_no;
  nodeFormState.parentNo = node.parent_no;
  nodeFormState.parentName = '';
  nodeFormVisible.value = true;
};
const onDeleteNode = (node: LevelNode) => {
  ElMessageBox.confirm(`确定删除层级「${node.name}」吗？`, '删除层级', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    closeOnClickModal: false
  })
    .then(async () => {
      try {
        await levelNodeDelete(node.node_no);
        ElMessage.success('删除成功');
        if (selectedNode.value?.node_no === node.node_no) selectedNode.value = null;
        loadTree(true);
      } catch (err: any) {
        if (err?.status === 400) ElMessage.error(err.msg);
      }
    })
    .catch(() => {});
};
const onNodeFormOk = () => loadTree(true);

// ----- 用户列表 -----
const usersLoading = ref(false);
const userList = ref<LevelUser[]>([]);
const userTotal = ref(0);
const queryFrom = reactive({
  keyword: '',
  page_index: 1,
  page_size: 15
});

const loadUsers = async () => {
  if (!selectedNode.value) {
    userList.value = [];
    userTotal.value = 0;
    return;
  }
  usersLoading.value = true;
  try {
    const res: any = await levelNodeUsersGet(selectedNode.value.node_no, {
      keyword: queryFrom.keyword,
      page_index: queryFrom.page_index,
      page_size: queryFrom.page_size
    });
    userList.value = res?.list || [];
    userTotal.value = res?.count || 0;
  } finally {
    usersLoading.value = false;
  }
};

const onSearchUsers = () => {
  queryFrom.page_index = 1;
  loadUsers();
};

const onPageSizeChange = (s: number) => {
  queryFrom.page_size = s;
  queryFrom.page_index = 1;
  loadUsers();
};
const onPageIndexChange = (p: number) => {
  queryFrom.page_index = p;
  loadUsers();
};

// 切换权限（加人/建群）
const onTogglePermission = async (row: LevelUser, val: boolean) => {
  try {
    await levelUserPermissionPut({
      uid: row.uid,
      can_invite_or_create_group: val ? 1 : 0
    });
    row.can_invite_or_create_group = val ? 1 : 0;
    ElMessage.success(val ? '已开启加人/建群权限' : '已关闭加人/建群权限');
  } catch (err: any) {
    // 失败回滚开关
    row.can_invite_or_create_group = val ? 0 : 1;
    if (err?.status === 400) ElMessage.error(err.msg);
  }
};

// 整个层级一键切换：把当前选中层级下所有用户的加人/建群权限设为 enable
const nodePermissionLoading = ref(false);
const onToggleNodePermission = (enable: boolean) => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择左侧一个层级');
    return;
  }
  const action = enable ? '开启' : '关闭';
  ElMessageBox.confirm(
    `确定将「${selectedNode.value.name}」层级下所有用户的「加人/建群权限」一键${action}吗？`,
    `${action}该层级所有用户的加人/建群权限`,
    {
      confirmButtonText: action,
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false
    }
  )
    .then(async () => {
      nodePermissionLoading.value = true;
      try {
        const res: any = await levelNodePermissionPut(selectedNode.value!.node_no, {
          can_invite_or_create_group: enable ? 1 : 0
        });
        ElMessage.success(`已${action}，影响 ${res?.affected ?? 0} 个用户`);
        // 刷新当前页用户开关状态
        loadUsers();
      } catch (err: any) {
        if (err?.status === 400) ElMessage.error(err.msg);
      } finally {
        nodePermissionLoading.value = false;
      }
    })
    .catch(() => {});
};

// 添加成员到当前层级
const addMembersVisible = ref(false);
const onAddMembers = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择左侧一个层级');
    return;
  }
  addMembersVisible.value = true;
};
const onAddMembersOk = () => {
  loadUsers();
  loadTree(true); // 节点用户数刷新（被加入的用户原层级人数 -1、当前层级 +1）
};

// 把用户移出当前层级（同时解除该层级默认好友）
const onRemoveUser = (row: LevelUser) => {
  if (!selectedNode.value) return;
  ElMessageBox.confirm(
    `确定将「${row.name || row.uid}」从「${selectedNode.value.name}」层级中移出吗？\n（同时会解除该层级的默认好友关系）`,
    '移出层级',
    {
      confirmButtonText: '移出',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false
    }
  )
    .then(async () => {
      try {
        await levelUserRemovePut({ uid: row.uid });
        ElMessage.success('已移出层级');
        loadUsers();
        loadTree(true); // 节点用户数刷新
      } catch (err: any) {
        if (err?.status === 400) ElMessage.error(err.msg);
      }
    })
    .catch(() => {});
};

// 移动用户
const moveUserVisible = ref(false);
const moveUserState = reactive({ uid: '', name: '', currentNodeNo: '' });
const onMoveUser = (row: LevelUser) => {
  moveUserState.uid = row.uid;
  moveUserState.name = row.name || row.uid;
  moveUserState.currentNodeNo = row.level_node_no;
  moveUserVisible.value = true;
};
const onMoveUserOk = () => {
  loadUsers();
  loadTree(true); // 节点用户数量需刷新
};

onMounted(() => {
  loadTree();
});
</script>

<template>
  <bd-page class="flex-col">
    <div class="flex-1 flex gap-12px overflow-hidden p-12px">
      <!-- 左：层级树 -->
      <div class="w-320px el-card border-none flex-col overflow-hidden">
        <div class="h-50px pl-12px pr-12px flex items-center justify-between bd-title">
          <p class="m-0 font-600">层级</p>
          <el-button type="primary" size="small" @click="onAddRoot">新增顶级层级</el-button>
        </div>
        <div class="flex-1 overflow-auto p-8px">
          <el-tree
            v-loading="treeLoading"
            :data="treeData"
            node-key="node_no"
            :default-expand-all="true"
            :highlight-current="true"
            :expand-on-click-node="false"
            @node-click="onTreeNodeClick"
          >
            <template #default="{ data }">
              <div class="flex items-center justify-between w-full pr-4px">
                <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {{ data.name }}
                  <span class="text-12px text-#999 ml-4px">({{ data.user_count }})</span>
                </span>
                <el-dropdown trigger="click" @click.stop>
                  <i-bd-more class="cursor-pointer text-#999" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="onAddChild(data)">新增子层级</el-dropdown-item>
                      <el-dropdown-item @click="onEditNode(data)">编辑</el-dropdown-item>
                      <el-dropdown-item divided @click="onDeleteNode(data)">
                        <span class="text-red">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-tree>
          <el-empty v-if="!treeLoading && treeData.length === 0" description="暂无层级，点击右上角新增" :image-size="80" />
        </div>
      </div>

      <!-- 右：层级详情 + 用户列表 -->
      <div class="flex-1 el-card border-none flex-col overflow-hidden">
        <div class="h-50px pl-12px pr-12px flex items-center justify-between bd-title">
          <div class="bd-title-left flex items-center">
            <p class="m-0 font-600">
              <template v-if="selectedNode">
                {{ selectedNode.name }}
                <span class="text-12px text-#999 ml-8px">
                  邀请码：<span class="font-600 text-#333">{{ selectedNode.invite_code }}</span>
                  &nbsp;&nbsp;负责人：{{ selectedNode.owner_name || selectedNode.owner_uid || '-' }}
                </span>
              </template>
              <template v-else>请选择左侧层级查看用户</template>
            </p>
          </div>
          <div v-if="selectedNode" class="flex items-center">
            <!-- 添加成员（批量移动到当前层级） -->
            <el-button type="primary" size="default" class="!mr-8px" @click="onAddMembers">
              <i-bd-add-user class="mr-4px" />
              添加成员
            </el-button>
            <!-- 整个层级一键开/关加人 / 建群权限 -->
            <el-button
              :loading="nodePermissionLoading"
              type="success"
              plain
              size="default"
              class="!mr-8px"
              @click="onToggleNodePermission(true)"
            >
              全部开启加人/建群
            </el-button>
            <el-button
              :loading="nodePermissionLoading"
              type="warning"
              plain
              size="default"
              class="!mr-12px"
              @click="onToggleNodePermission(false)"
            >
              全部关闭加人/建群
            </el-button>
            <el-form inline>
              <el-form-item class="mb-0 !mr-12px">
                <el-input
                  v-model="queryFrom.keyword"
                  placeholder="昵称/手机号/uid"
                  clearable
                  style="width: 200px"
                  @clear="onSearchUsers"
                />
              </el-form-item>
              <el-form-item class="mb-0 !mr-0">
                <el-button type="primary" @click="onSearchUsers">查询</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div class="flex-1 overflow-hidden p-12px">
          <el-table v-loading="usersLoading" :data="userList" :border="true" style="width: 100%; height: 100%">
            <el-table-column type="index" width="42" :align="'center'" :fixed="'left'" />
            <el-table-column prop="name" label="昵称" min-width="120" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="username" label="用户名" min-width="130" />
            <el-table-column prop="uid" label="UID" min-width="200" />
            <el-table-column prop="short_no" label="喜聊号" width="160" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">{{ row.status === 1 ? '正常' : '封禁' }}</template>
            </el-table-column>
            <el-table-column label="加人/建群权限" width="140" :align="'center'">
              <template #default="{ row }">
                <ElSwitch
                  :model-value="row.can_invite_or_create_group === 1"
                  @change="(v: any) => onTogglePermission(row, !!v)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="register_time" label="注册时间" width="170" />
            <el-table-column label="操作" width="220" :align="'center'" :fixed="'right'">
              <template #default="{ row }">
                <ElButton type="primary" size="small" @click="onMoveUser(row)">移动到其它层级</ElButton>
                <ElButton type="danger" size="small" @click="onRemoveUser(row)">移出层级</ElButton>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="selectedNode" class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
          <div></div>
          <el-pagination
            v-model:current-page="queryFrom.page_index"
            v-model:page-size="queryFrom.page_size"
            :page-sizes="[15, 20, 30, 50, 100]"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="userTotal"
            @size-change="onPageSizeChange"
            @current-change="onPageIndexChange"
          />
        </div>
      </div>
    </div>

    <!-- 创建/编辑层级 -->
    <NodeForm
      v-model:value="nodeFormVisible"
      :node-no="nodeFormState.nodeNo"
      :parent-no="nodeFormState.parentNo"
      :parent-name="nodeFormState.parentName"
      @ok="onNodeFormOk"
    />
    <!-- 移动用户 -->
    <MoveUser
      v-model:value="moveUserVisible"
      :uid="moveUserState.uid"
      :user-name="moveUserState.name"
      :current-node-no="moveUserState.currentNodeNo"
      @ok="onMoveUserOk"
    />
    <!-- 批量添加成员到当前层级 -->
    <AddMembers
      v-model:value="addMembersVisible"
      :node-no="selectedNode?.node_no || ''"
      :node-name="selectedNode?.name || ''"
      @ok="onAddMembersOk"
    />
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 层级管理
  isAffix: false
</route>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
