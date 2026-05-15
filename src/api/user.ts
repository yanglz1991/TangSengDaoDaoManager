import request from '@/utils/axios';

// 添加用户
export function userAddPost(data: any) {
  return request({
    url: '/manager/user/add',
    method: 'post',
    data
  });
}

// 批量生成账户（手机号递增）
//   start_phone: 起始手机号（11 位字符串）
//   count: 生成数量（1-1000）
//   zone: 区号，默认 0086
//   password: 登录密码，留空则使用各账号自身手机号
//   sex: 性别，0/1
//   can_invite_or_create_group: 是否开启「加人/建群」权限 0/1
export interface UserBatchAddReq {
  start_phone: string;
  count: number;
  zone?: string;
  password?: string;
  sex?: number;
  can_invite_or_create_group?: number;
}

export function userBatchAddPost(data: UserBatchAddReq) {
  return request({
    url: '/manager/user/batch_add',
    method: 'post',
    data
  });
}

// 用户列表
export function userListGet(params: any) {
  return request({
    url: '/manager/user/list',
    method: 'get',
    params
  });
}

// 封禁用户列表
export function userDisablelistGet(params: any) {
  return request({
    url: '/manager/user/disablelist',
    method: 'get',
    params
  });
}

// 好友列表
export function userFriendsGet(params: any) {
  return request({
    url: 'manager/user/friends',
    method: 'get',
    params
  });
}

// 黑名单列表
export function userBlacklistGet(params: any) {
  return request({
    url: 'manager/user/blacklist',
    method: 'get',
    params
  });
}

// 用户封禁/解禁
export function userLiftbanPut(params: any) {
  return request({
    url: `manager/user/liftban/${params.uid}/${params.status}`,
    method: 'put'
  });
}

// 重置/修改指定用户密码（超管）
export function userResetPasswordPost(data: { uid: string; new_password: string; new_password_confirmation: string }) {
  return request({
    url: '/manager/user/resetpassword',
    method: 'post',
    data
  });
}

// 修改指定用户昵称（超管）
export function userUpdateNamePost(data: { uid: string; name: string }) {
  return request({
    url: '/manager/user/updatename',
    method: 'post',
    data
  });
}

// IP 列表（含关联用户与黑名单状态）
export function userIpListGet(params: any) {
  return request({
    url: '/manager/user/iplist',
    method: 'get',
    params
  });
}

// 封禁 IP
export function userIpBlacklistAddPost(data: { ip: string; reason?: string }) {
  return request({
    url: '/manager/user/ipblacklist/add',
    method: 'post',
    data
  });
}

// 解禁 IP
export function userIpBlacklistRemovePost(data: { ip: string }) {
  return request({
    url: '/manager/user/ipblacklist/remove',
    method: 'post',
    data
  });
}

// 设备列表（含关联用户与黑名单状态）
export function userDeviceListGet(params: any) {
  return request({
    url: '/manager/user/devicelist',
    method: 'get',
    params
  });
}

// 封禁设备
export function userDeviceBlacklistAddPost(data: { device_id: string; reason?: string }) {
  return request({
    url: '/manager/user/deviceblacklist/add',
    method: 'post',
    data
  });
}

// 解禁设备
export function userDeviceBlacklistRemovePost(data: { device_id: string }) {
  return request({
    url: '/manager/user/deviceblacklist/remove',
    method: 'post',
    data
  });
}

// 管理员-列表
export function adminList() {
  return request({
    url: `manager/user/admin`,
    method: 'get'
  });
}

// 管理员-新增
export function adminAdd(data: any) {
  return request({
    url: `manager/user/admin`,
    method: 'post',
    data
  });
}

// 管理员-删除
export function adminDelete(params: any) {
  return request({
    url: `manager/user/admin`,
    method: 'delete',
    params
  });
}
