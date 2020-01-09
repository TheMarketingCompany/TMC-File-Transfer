<template>
  <div :class="containerClass" @click="onDocumentClick">
    <div class="layout-content-wrapper">

      <div class="layout-menu-container" @click="onMenuClick">
        <div class="overlay-menu-button" @click="onMenuButtonClick">
          <div class="overlay-menu-button-bars">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="overlay-menu-button-times">
            <span></span>
            <span></span>
          </div>
        </div>

      </div>

      <div class="layout-content">
        <router-view/>
      </div>


      <div class="layout-mask"></div>
    </div>
  </div>
</template>

<script>
import EventBus from './event-bus';

export default {
  props: {
    theme: String,
    layout: String
  },
  data() {
    return {
      layoutMode: 'horizontal',
      wrapperMode: false,
      overlayMenuActive: false,
      mobileMenuActive: false,
      topbarMenuActive: false,
      activeTopbarItem: null,
      menuActive: false,
      configActive: false,
      configClick: false,
      windowWidth: 0
    }
  },
  watch: {
    $route() {
      this.menuActive = false;
      this.$toast.removeAllGroups();
    }
  },
  mounted() {
    this.$nextTick(function () {
      window.addEventListener('resize', this.getWindowWidth);

      this.getWindowWidth();
    })

  },
  methods: {
    getWindowWidth() {
      this.windowWidth = document.documentElement.clientWidth;
      if (this.windowWidth < 991) {
        this.$appState.fullWidth = true;
      } else {
        this.$appState.fullWidth = false;
      }
    },
    onDocumentClick() {
      if (!this.topbarItemClick) {
        this.activeTopbarItem = null;
        this.topbarMenuActive = false;
      }

      if (!this.menuClick) {
        if (this.isHorizontal()) {
          this.menuActive = false;
          EventBus.emit('reset-active-index');
        }

        this.hideOverlayMenu();
      }

      if (this.configActive && !this.configClick) {
        this.configActive = false;
      }

      this.topbarItemClick = false;
      this.menuClick = false;
      this.configClick = false;
    },
    onProfileClick(event) {
      this.profileExpanded = !this.profileExpanded;
      if (this.isHorizontal()) {
        EventBus.emit('reset-active-index');
      }

      event.preventDefault();
    },
    onMenuClick() {
      this.menuClick = true;
    },
    onMenuItemClick(event) {
      if (!event.item.items) {
        EventBus.emit('reset-active-index');
        this.hideOverlayMenu();

        if (this.isHorizontal()) {
          this.menuActive = false;
        }
      }
    },
    onRootMenuItemClick() {
      this.menuActive = !this.menuActive;
    },
    onMenuButtonClick(event) {
      this.menuClick = true;

      this.topbarMenuActive = false;
      if (this.isDesktop()) {
        if (this.layoutMode === 'overlay') {
          this.overlayMenuActive = !this.overlayMenuActive;
        }
      } else {
        this.mobileMenuActive = !this.mobileMenuActive;
      }

      event.preventDefault();
    },
    onTopbarMenuButtonClick(event) {
      this.topbarItemClick = true;
      this.topbarMenuActive = !this.topbarMenuActive;
      this.hideOverlayMenu();
      event.preventDefault();
    },
    onTopbarItemClick(event) {
      this.topbarItemClick = true;

      if (this.activeTopbarItem === event.item)
        this.activeTopbarItem = null;
      else
        this.activeTopbarItem = event.item;

      event.originalEvent.preventDefault();
    },
    hideOverlayMenu() {
      this.overlayMenuActive = false;
      this.mobileMenuActive = false;
    },
    isDesktop() {
      return window.innerWidth > 1024;
    },
    isHorizontal() {
      return this.layoutMode === 'horizontal';
    },
    onLayoutModeChange(layoutMode) {
      this.layoutMode = layoutMode;
      this.staticMenuDesktopInactive = false;
      this.overlayMenuActive = false;
    },
    onThemeChange(theme) {
      this.$emit('theme-change', theme);
    },
    onLayoutChange(layout) {
      this.$emit('layout-change', layout);
    },
    onConfigClick() {
      this.configClick = true;
    },
    onConfigButtonClick() {
      this.configActive = !this.configActive;
      this.configClick = true;
    },
    isMobile() {
      return window.innerWidth <= 991;
    }
  },
  computed: {
    containerClass() {
      return ['layout-wrapper', {
        'layout-menu-overlay': this.layoutMode === 'overlay',
        'layout-menu-overlay-active': this.overlayMenuActive,
        'layout-mobile-active': this.mobileMenuActive,
        'layout-menu-horizontal': this.layoutMode === 'horizontal',
        'p-input-filled': this.$primevue.config.inputStyle === 'filled',
        'p-ripple-disabled': this.$primevue.config.ripple === false
      },
        {
          'layout-fullwidth': this.$appState.fullWidth
        }];
    }
  },
  components: {
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.getWindowWidth);
  }
}
</script>

<style lang="scss">
@import './App.scss';
</style>
