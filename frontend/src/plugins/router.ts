import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/conversations' },
    {
      path: '/login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/conversations',
      component: () => import('@/pages/ConversationsPage.vue'),
    },
    {
      path: '/account',
      component: () => import('@/pages/AccountPage.vue'),
    },
  ],
})

router.beforeEach(to => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) return '/login'
})

export default router
