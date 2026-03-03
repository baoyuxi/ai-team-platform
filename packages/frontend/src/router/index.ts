import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/project',
  },
  {
    path: '/project',
    name: 'Project',
    component: () => import('@/views/ProjectView.vue'),
    meta: { title: '项目管理' },
  },
  {
    path: '/workspace/:id',
    name: 'Workspace',
    component: () => import('@/views/WorkspaceView.vue'),
    meta: { title: '工作空间' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI Team Platform`;
  }
  next();
});

export default router;
