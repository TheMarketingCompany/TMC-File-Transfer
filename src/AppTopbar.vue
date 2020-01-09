<template>
	<div class="layout-topbar">

		<ul class="layout-topbar-menu">
			<li :class="[{'active-topmenuitem': activeTopbarItem === 'profile'}]" class="user-profile"
				@click="$emit('topbar-item-click',{originalEvent:$event,item:'profile'})">
				<a href="#">
					<div class="user-profile-info profile-link">
						<span class="user-profile-name">Ava Gregoraci</span>
						<span class="user-profile-role">Design Ops</span>
					</div>
					<img class="logo" src="layout/images/avatar/avatar-ava.jpg" alt="prestige-layout" />
				</a>
				<transition name="layout-submenu-container">
					<ul class="fadeInDown" v-show="activeTopbarItem === 'profile'">
						<li class="profile-detail">
							<div class="user-profile-info">
								<img class="logo" src="layout/images/avatar/avatar-ava.jpg" alt="prestige-layout" />
								<div class="profile-info">
									<span class="user-profile-name">Ava Gregoraci</span>
									<span class="user-profile-role">Design Ops</span>
								</div>
								<a href="#" class="profile-detail-icon" >
									<i class="pi pi-sign-out"></i>
								</a>
							</div>
						</li>
						<li>
							<a href="#" >
								<i class="pi pi-user"></i>
								<div class="menu-text">
									<span class="menu-title">Profile</span>
									<span class="menu-subtitle">Edit your profile</span>
								</div>

								<i class="right-icon pi pi-angle-right"></i>
							</a>
						</li>
						<li>
							<a href="#" >
								<i class="pi pi-cog"></i>
								<div class="menu-text">
									<span class="menu-title">Settings</span>
									<span class="menu-subtitle">Dashboard Settings</span>
								</div>
								<i class="right-icon pi pi-angle-right"></i>
							</a>
						</li>
						<li>
							<a href="#" >
								<i class="pi pi-inbox"></i>
								<div class="menu-text">
									<span class="menu-title">Messages</span>
									<span class="menu-subtitle">You have a <div class="blue">3 new</div> messages</span>
								</div>
								<i class="right-icon pi pi-angle-right"></i>
							</a>
						</li>
						<li>
							<a href="#" >
								<i class="pi pi-globe"></i>
								<div class="menu-text">
									<span class="menu-title">Notification</span>
									<span class="menu-subtitle">No new notification</span>
								</div>
								<i class="right-icon pi pi-angle-right"></i>
							</a>
						</li>
					</ul>
				</transition>
			</li>
		</ul>

	</div>
</template>

<script>
	export default {
		emits: ['topbar-item-click', 'menubutton-click', 'topbar-menubutton-click'],
		props: {
			topbarMenuActive: Boolean,
			activeTopbarItem: String
		},
		methods: {
			onMenuButtonClick(event) {
				this.$emit('menubutton-click', event);
			},
			onTopbarMenuButtonClick(event) {
				this.$emit('topbar-menubutton-click', event);
			}
		},
		computed: {

		}
	}
</script>
