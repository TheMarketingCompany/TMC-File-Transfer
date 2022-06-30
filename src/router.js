import {createRouter, createWebHistory} from 'vue-router';

const routes = [
	{
		path: '/',
		name: 'nope',
		redirect: 'dl'
	},
	{
		path: '/db',
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
    history: createWebHistory(),
    routes,
	scrollBehavior () {
        return { left: 0, top: 0 };
    }
});

export default router;
