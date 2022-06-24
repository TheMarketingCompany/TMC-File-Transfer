import {createRouter, createWebHashHistory} from 'vue-router';

const routes = [
	{
		path: '/',
		name: 'dashboard',
		exact: true,
		component: () => import('./components/Dashboard.vue')
	},
	{
		path: '/dl',
		name: 'download',
		exact: true,
		component: () => import('./components/Download.vue')
	},
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
	scrollBehavior () {
        return { left: 0, top: 0 };
    }
});

export default router;
