import request from '@/utils/axios';

// 更新密码
export function userUpdatepasswordPost(data: any) {
  return request({
    url: '/manager/user/updatepassword',
    method: 'post',
    data
  });
}

// 获取通用设置
export function getAppconfigGet(params?: any) {
  return request({
    url: '/manager/common/appconfig',
    method: 'get',
    params
  });
}

// 更新通用设置
export function updateAppconfigPost(data: any) {
  return request({
    url: '/manager/common/appconfig',
    method: 'post',
    data
  });
}

// 获取加密通道配置
export function getSecureChannelGet() {
  return request({
    url: '/manager/common/secure_channel',
    method: 'get'
  });
}

// 更新加密通道配置
export function updateSecureChannelPut(data: any) {
  return request({
    url: '/manager/common/secure_channel',
    method: 'put',
    data
  });
}
