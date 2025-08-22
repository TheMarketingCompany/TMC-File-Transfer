declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $router: import('vue-router').Router;
    $route: import('vue-router').RouteLocationNormalizedLoaded;
  }
}