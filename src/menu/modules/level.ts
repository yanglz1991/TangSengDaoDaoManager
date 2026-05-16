// 注意：vite-plugin-pages 默认把 pages/level/index.vue 注册到 path "/level"（不是 "/level/index"）。
// 这里使用单层菜单（无 children）以与首页 "/home" 保持一致；老版本 "/level/index" 的菜单
// 配置会跳到不存在的路由 → 页面空白。
const level: Menu.MenuOptions = {
  component: '/level/index',
  name: 'levelIndex',
  path: '/level',
  meta: {
    icon: 'i-bd-tree-diagram',
    isAffix: false,
    isFull: false,
    isHide: false,
    isKeepAlive: true,
    isLink: '',
    auth: ['superAdmin'],
    index: 3,
    title: '层级管理'
  }
};
export default level;
