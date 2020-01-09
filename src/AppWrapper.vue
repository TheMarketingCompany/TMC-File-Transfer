<template>
    <App :theme="theme" :layout="layout" @theme-change="onThemeChange" @layout-change="onLayoutChange"/>
</template>

<script>
    import App from './App.vue';

	export default {
        data() {
            return {
                theme: 'blue',
                layout: 'layout-blue'
            }
        },
        methods: {
            onThemeChange(theme) {
                this.theme = theme;
            },
            onLayoutChange(layout) {
                this.layout = layout;
            }
        },
        components: {
            "App": App,
        }
	}
</script>

<style scoped>
</style>
