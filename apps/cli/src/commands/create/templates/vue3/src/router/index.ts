import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'example',
      component: () => import('../views/example/index.vue'),
    },
  ],
})

export default router
