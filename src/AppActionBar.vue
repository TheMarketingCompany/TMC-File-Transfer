<template>
    <div class="layout-actionbar">
        <div class="layout-breadcrumb">
            <span v-if="$route.meta.breadcrumb && $route.meta.breadcrumb[0]">
                {{$route.meta.breadcrumb[0].parent}}
                <span v-if="$route.meta.breadcrumb[0].label">
                    <i class="pi pi-fw pi-chevron-right mr-1" style="font-size: 0.8rem"></i>
                </span>{{$route.meta.breadcrumb[0].label}}
            </span>
        </div>
        <div class="layout-actions">
            <ul>
                <li>
                    <button><i class="pi pi-compass icon"></i></button>
                </li>
                <li>
                    <button><i class="pi pi-inbox icon"></i></button>
                </li>
                <li>
                    <button><i class="pi pi-file-o icon"></i></button>
                </li>
                <li>
                    <button><i class="pi pi-info-circle icon"></i></button>
                </li>
                <li>
                    <button><i class="pi pi-user icon"></i></button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
	export default {
        name: "AppActionBar",
        methods: {
            home() {
                this.$router.push({path: '/'});
            }
		}
	}
</script>

<style scoped>

</style>
