import request from '@/utils/axios';

/**
 * 层级管理 API
 *
 * 后台路由：/manager/level/...
 *
 * 树形结构：
 *   - parent_no === '' 代表顶层
 *   - 同名 invite_code 全局唯一
 *
 * 注册流程：
 *   - 客户端注册时若 invite_code 命中某层级，则该用户 user.level_node_no 写为该层级，
 *     并自动与层级负责人 + 默认好友互为好友。
 */

export interface LevelNodeReq {
  parent_no?: string;
  name: string;
  owner_uid: string;
  invite_code: string;
  default_friend_uids?: string[];
}

export interface LevelNode {
  node_no: string;
  parent_no: string;
  name: string;
  owner_uid: string;
  owner_name: string;
  invite_code: string;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface LevelNodeDetail extends LevelNode {
  default_friends: { uid: string; name: string }[];
}

export interface LevelUser {
  uid: string;
  name: string;
  phone: string;
  username: string;
  short_no: string;
  status: number;
  can_invite_or_create_group: number;
  register_time: string;
  level_node_no: string;
}

// 树形列表（扁平）
export function levelTreeGet() {
  return request({
    url: '/manager/level/tree',
    method: 'get'
  });
}

// 详情
export function levelNodeGet(nodeNo: string) {
  return request({
    url: `/manager/level/node/${nodeNo}`,
    method: 'get'
  });
}

// 创建
export function levelNodeAdd(data: LevelNodeReq) {
  return request({
    url: '/manager/level/node',
    method: 'post',
    data
  });
}

// 修改
export function levelNodeUpdate(nodeNo: string, data: LevelNodeReq) {
  return request({
    url: `/manager/level/node/${nodeNo}`,
    method: 'put',
    data
  });
}

// 删除
export function levelNodeDelete(nodeNo: string) {
  return request({
    url: `/manager/level/node/${nodeNo}`,
    method: 'delete'
  });
}

// 层级下用户
export function levelNodeUsersGet(nodeNo: string, params: { keyword?: string; page_index?: number; page_size?: number }) {
  return request({
    url: `/manager/level/node/${nodeNo}/users`,
    method: 'get',
    params
  });
}

// 用户搜索（用于选负责人 / 默认好友 / 移动）
export function levelUsersSearchGet(params: { keyword?: string; limit?: number }) {
  return request({
    url: '/manager/level/users/search',
    method: 'get',
    params
  });
}

// 切换用户加人/建群权限
export function levelUserPermissionPut(data: { uid: string; can_invite_or_create_group: number }) {
  return request({
    url: '/manager/level/user/permission',
    method: 'put',
    data
  });
}

// 整个层级一键切换：把该层级下所有用户的加人/建群权限统一设为 0/1。
// 服务端返回 { affected: 受影响行数 }。
export function levelNodePermissionPut(nodeNo: string, data: { can_invite_or_create_group: number }) {
  return request({
    url: `/manager/level/node/${nodeNo}/permission`,
    method: 'put',
    data
  });
}

// 移动用户到指定层级（也用于「添加成员」）
//   can_invite_or_create_group 可选；传则在移动同时设置该用户在新层级的加人/建群权限
export function levelUserMovePut(data: {
  uid: string;
  node_no: string;
  can_invite_or_create_group?: number;
}) {
  return request({
    url: '/manager/level/user/move',
    method: 'put',
    data
  });
}

// 把用户移出当前层级（同时双向解除该层级默认好友）
export function levelUserRemovePut(data: { uid: string }) {
  return request({
    url: '/manager/level/user/remove',
    method: 'put',
    data
  });
}
