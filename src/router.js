import {createRouter, createWebHashHistory} from 'vue-router';

const routes = [
	{
		path: '/',
		name: 'dashboard',
		meta: {
			breadcrumb: [{parent:'Dashboard', label:''}]
		},
		exact: true,
		component: () => import('./components/Dashboard.vue')
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
