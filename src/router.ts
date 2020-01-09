import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";

// @ts-ignore
import UploadPage from './components/UploadPage.vue';
// @ts-ignore
import DownloadPage from './components/DownloadPage.vue';
// @ts-ignore
import TOS from "./components/TOS.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'root',
        redirect: '/dl'
    },
    {
        path: '/dl',
        component: DownloadPage
    },
    {
        path: '/upload',
        component: UploadPage
    },
    {
        path: '/tos',
        component: TOS
    }
]



const router = createRouter({
    history: createWebHistory(),
    routes
})

// @ts-ignore
router.beforeEach((to, from, next) => {
    if (to.path !== window.location.pathname) {
        console.log('ok')
        window.location.href = to.fullPath;
    } else {
        next();
    }
});

export default router;
