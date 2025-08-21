import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import UploadPageNew from './components/UploadPageNew.vue';
import DownloadPageNew from './components/DownloadPageNew.vue';
import TOS from './components/TOS.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    redirect: '/upload'
  },
  {
    path: '/dl/:fileId?',
    name: 'download',
    component: DownloadPageNew,
    props: true
  },
  {
    path: '/upload',
    name: 'upload',
    component: UploadPageNew
  },
  {
    path: '/tos',
    name: 'terms',
    component: TOS
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/upload'
  }
];


const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

export default router;
