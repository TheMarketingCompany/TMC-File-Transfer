<template>
    <div class="grid">
        <div class="col-12">
            <div class="card docs">
                <h4>Current Version</h4>
                <p>Vue 3 and PrimeVue 3.x</p>
				
				<h4>Dependencies</h4>
				<p>
					Prestige has no direct dependency other than PrimeVue. More	information about dependencies is available at
					<a href="https://www.primefaces.org/primevue-3-0-0-final-released-for-vue-3/">PrimeVue 3.0.0 Is Ready For PrimeTime</a>
					article.
				</p>

                <h4>Getting Started</h4>
                <p>Prestige is an application template for Vue based on the <a href="https://cli.vuejs.org/">Vue CLI</a> that provides out-of-the-box standard
                tooling for Vue projects. If you don"t have CLI installed already run the following command.</p>
<pre v-code><code>
npm install -g @vue/cli

# OR

yarn global add @vue/cli

</code></pre>

                <p>Once CLI is ready in your system, extract the contents of the Prestige zip file distribution, cd to the directory and install the libraries from npm.</p>

<pre v-code><code>
cd prestige
npm install
npm run serve

</code></pre>

                <p>The application should run at http://localhost:8080/, you may now start with the development of your application.</p>

                <h4>Important CLI Commands</h4>
                <p>Following commands are derived from CLI.</p>
<pre v-code><code>
"npm run serve": Starts the development server
"npm run build": Builds the application for deployment.
"npm run lint": Executes the lint checks.
"npm run test:unit": Runs the tests.

</code></pre>

                <h4>Structure</h4>
                <p>Prestige consists of 2 main parts; the application layout and the resources. <i>App.vue</i> inside src folder is the main component containing the template for the base layout
                    whereas required resources such as SASS structure for the layout are placed inside the <b>public/layout</b> folder.</p>

                <h4>Template</h4>
                <p>Main layout is the template of the <i>App.vue</i>, it is divided into a couple of child components such as topbar, content, menu and footer. Here is template of the
                    <i>App.vue</i> component that implements the logic such as menu state, layout modes and other configurable options.
                </p>

<pre v-code><code>
&lt;div :class="containerClass" @click="onDocumentClick"&gt;
    &lt;div&gt;
        &lt;AppTopBar :topbarMenuActive="topbarMenuActive" :horizontal="layoutMode === "horizontal"" :activeTopbarItem="activeTopbarItem"
            @menubutton-click="onMenuButtonClick" @topbar-menubutton-click="onTopbarMenuButtonClick" @topbar-item-click="onTopbarItemClick"&gt;&lt;/AppTopBar&gt;

            &lt;div class="layout-menu-container" @click="onMenuClick"&gt;
                &lt;div class="overlay-menu-button" @click="onMenuButtonClick"&gt;
                    &lt;div class="overlay-menu-button-bars"&gt;
                    &lt;span&gt;&lt;/span&gt;
                    &lt;span&gt;&lt;/span&gt;
                    &lt;span&gt;&lt;/span&gt;
                &lt;/div&gt;
                &lt;div class="overlay-menu-button-times"&gt;
                    &lt;span&gt;&lt;/span&gt;
                    &lt;span&gt;&lt;/span&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class="layout-menu-wrapper fadeInDown"&gt;
                &lt;AppMenu :layoutMode="layoutMode" :active="menuActive"
                    @menuitem-click="onMenuItemClick" @root-menuitem-click="onRootMenuItemClick"&gt;&lt;/AppMenu&gt;
            &lt;/div&gt;
        &lt;/div&gt;

        &lt;AppActionBar /&gt;

        &lt;div class="layout-content"&gt;
            &lt;router-view /&gt;
        &lt;/div&gt;

        &lt;AppConfig :layoutMode="layoutMode" :wrapperMode="wrapperMode" @layout-mode-change="onLayoutModeChange" @wrapper-mode-change="onWrapperModeChange"&gt;&lt;/AppConfig&gt;

        &lt;AppFooter /&gt;

        &lt;div class="layout-mask"&gt;&lt;/div&gt;
    &lt;/div&gt;
&lt;/div&gt;

</code></pre>

                <h4>Menu</h4>
                <p>Menu is a separate component defined in <i>AppMenu.vue</i> file based on PrimeVue MenuModel API. In order to define the menuitems,
                    navigate to data section of <i>App.vue</i> file and define your own model as a nested structure using the menu property.
                    Here is the menu component from the demo application. Notice that menu object is bound to the model property of AppMenu component as shown above.</p>

<div style="overflow: auto; height: 400px">
<pre v-code.script>
<code>
data() &#123;
    return &#123;
        menu : [
			&#123;label: "Dashboard", icon: "pi pi-fw pi-home", to:"/"&#125;,
			{
				label: "UI Kit", icon: "pi pi-fw pi-star-fill",
				items: [
					{label: "Form Layout", icon: "pi pi-fw pi-id-card", to: "/formlayout"},
					{label: "Input", icon: "pi pi-fw pi-check-square", to: "/input"},
					{label: "Float Label", icon: "pi pi-fw pi-bookmark", to: "/floatlabel"},
					{label: "Invalid State", icon: "pi pi-fw pi-exclamation-circle", to: "/invalidstate"},
					{label: "Button", icon: "pi pi-fw pi-mobile", to: "/button", class: "rotated-icon"},
					{label: "Table", icon: "pi pi-fw pi-table", to: "/table"},
					{label: "List", icon: "pi pi-fw pi-list", to: "/list"},
					{label: "Tree", icon: "pi pi-fw pi-share-alt", to: "/tree"},
					{label: "Panel", icon: "pi pi-fw pi-tablet", to: "/panel"},
					{label: "Overlay", icon: "pi pi-fw pi-clone", to: "/overlay"},
					{label: "Media", icon: "pi pi-fw pi-image", to: "/media"},
					{label: "Menu", icon: "pi pi-fw pi-bars", to: "/menu"},
					{label: "Message", icon: "pi pi-fw pi-comment", to: "/messages"},
					{label: "File", icon: "pi pi-fw pi-file", to: "/file"},
					{label: "Chart", icon: "pi pi-fw pi-chart-bar", to: "/chart"},
					{label: "Misc", icon: "pi pi-fw pi-circle-off", to: "/misc"},
				]
			},
			{
				label: "Utilities", icon:"pi pi-fw pi-compass",
				items: [
					{label: "Display", icon:"pi pi-fw pi-desktop", to:"/display"},
					{label: "Elevation", icon:"pi pi-fw pi-external-link", to:"/elevation"},
					{label: "Flexbox", icon:"pi pi-fw pi-directions", to:"/flexbox"},
					{label: "Icons", icon:"pi pi-fw pi-prime", to:"/icons"},
					{label: "Widgets", icon:"pi pi-fw pi-star", to:"/widgets"},
					{label: "Grid System", icon:"pi pi-fw pi-th-large", to:"/grid"},
					{label: "Spacing", icon:"pi pi-fw pi-arrow-right", to:"/spacing"},
					{label: "Typography", icon:"pi pi-fw pi-align-center", to:"/typography"},
					{label: "Text", icon:"pi pi-fw pi-pencil", to:"/text"},
				]
			},
			{
				label: "UI Blocks", icon: "pi pi-building",
				items: [
					{label: "Free Blocks", icon: "pi pi-fw pi-eye", to: "/blocks", badge: "NEW"},
					{label: "All Blocks", icon: "pi pi-fw pi-globe", url: "https://www.primefaces.org/primeblocks-vue", target: "_blank"}
				]
			},
			{
				label: "Pages", icon: "pi pi-fw pi-briefcase",
				items: [
					{label: "Crud", icon: "pi pi-fw pi-pencil", to: "/crud"},
					{label: "Calendar", icon: "pi pi-fw pi-calendar-plus", to: "/calendar"},
					{label: "Timeline", icon: "pi pi-fw pi-calendar", to: "/timeline"},
					{label: "Landing", icon: "pi pi-fw pi-globe", url: "pages/landing.html", target: "_blank"},
					{label: "Login", icon: "pi pi-fw pi-sign-in", to: "/login"},
					{label: "Invoice", icon: "pi pi-fw pi-dollar", to: "/invoice"},
					{label: "Help", icon: "pi pi-fw pi-question-circle", to: "/help"},
					{label: "Error", icon: "pi pi-fw pi-times-circle", to: "/error"},
					{label: "Not Found", icon: "pi pi-fw pi-exclamation-circle", to: "/notfound"},
					{label: "Access Denied", icon: "pi pi-fw pi-lock", to: "/access"},
					{label: "Empty", icon: "pi pi-fw pi-circle-off", to: "/empty"}
				]
			},
			&#123;
				label: "Hierarchy", icon: "pi pi-fw pi-align-left",
				items: [
					&#123;
						label: "Submenu 1", icon: "pi pi-fw pi-align-left",
						items: [
							&#123;
								label: "Submenu 1.1", icon: "pi pi-fw pi-align-left",
								items: [
									&#123;label: "Submenu 1.1.1", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 1.1.2", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 1.1.3", icon: "pi pi-fw pi-align-left"&#125;,
								]
							&#125;,
							&#123;
								label: "Submenu 1.2", icon: "pi pi-fw pi-align-left",
								items: [
									&#123;label: "Submenu 1.2.1", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 1.2.2", icon: "pi pi-fw pi-align-left"&#125;
								]
							&#125;,
						]
					&#125;,
					&#123;
					label: "Submenu 2", icon: "pi pi-fw pi-align-left",
					items: [
						&#123;
							label: "Submenu 2.1", icon: "pi pi-fw pi-align-left",
							items: [
									&#123;label: "Submenu 2.1.1", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 2.1.2", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 2.1.3", icon: "pi pi-fw pi-align-left"&#125;,
								]
							&#125;,
							&#123;
								label: "Submenu 2.2", icon: "pi pi-fw pi-align-left",
								items: [
									&#123;label: "Submenu 2.2.1", icon: "pi pi-fw pi-align-left"&#125;,
									&#123;label: "Submenu 2.2.2", icon: "pi pi-fw pi-align-left"&#125;
								]
							&#125;,
						]
					&#125;
				]
			&#125;,
			&#123;label: "Buy Now", icon: "pi pi-fw pi-shopping-cart", url: "https://www.primefaces.org/store"&#125;,
			&#123;label: "Documentation", icon: "pi pi-fw pi-info-circle", to: "/documentation""&#125;,
		],
    &#125;
&#125;

</code></pre>
</div>

				<h4>Integration with an Existing CLI Project</h4>
				<p>
					To setup Prestige in an existing project, follow the steps
					below;
				</p>

				<ul>
					<li>Copy the <i>public</i> and <i>src/assets</i> folder to your projects folder with the same name</li>
					<li>Copy all <i>src/App*.vue</i> files to the src folder of your application.</li>
				</ul>

				<p>Install PrimeVue</p>

<pre v-code><code>
npm install primevue@latest --save
npm install	primeicons@latest --save

</code></pre>

                <p>Add PrimeVue CSS at styles section in main.js.</p>

<pre v-code><code>
import "primevue/resources/primevue.min.css";   	//required: PrimeVue components
import "primeicons/primeicons.css";	 				//required: PrimeIcons
import "./App.scss"; 	                            //your styles and overrides

</code></pre>

                <p>Last part is adding theme and layout css files, in the CLI app they are defined using link tags in index.html so the demo can switch them on the fly by changing the path however
                    if this is not a requirement, you may also add them to the styles configuration above so they go inside the bundle.</p>

                <h4>Integration with an Existing Non-CLI Project</h4>
                <p>For an existing project that do not use CLI, setup steps are more or less similar. Start with installing the dependencies listed above in package.json</p>
                <p>Copy the <i>src/assets</i> folder to your application and include the resources listed above with a module bundler like webpack or using link-script tags.</p>
                <p>Finally copy the contents of App.vue to your application"s main component template such as <i>app/index.html</i> along
                    with the sub components which are AppMenu.vue, AppTopbar.vue and AppFooter.vue.</p>

                <h4>Component Theme</h4>
                <p>Prestige provides 17 PrimeVue themes out of the box. Setup of a theme is simple by including the css of theme to your bundle that are located inside assets/theme folder such as public/theme/theme-pink.css.
					Full list of available themes are</p>
                <ul>
					<li>amber</li>
					<li>blue</li>
					<li>bluegray</li>
					<li>brown</li>
					<li>cyan</li>
					<li>deeporange</li>
					<li>deeppurple</li>
					<li>green</li>
					<li>indigo</li>
                    <li>lightblue</li>
                    <li>lightgreen</li>
					<li>lime</li>
                    <li>orange</li>
					<li>pink</li>
					<li>purple</li>
					<li>teal</li>
					<li>yellow</li>
                </ul>

				<p>A custom theme can be developed by the following steps.</p>
				<ul>
					<li>Choose a custom theme name such as "mytheme".</li>
					<li>Create a folder named "mytheme" under <i>public/theme folder</i>.</li>
					<li>Create a file such as theme.scss under <i>public/theme/mytheme folder</i>.</li>
					<li>Define the variables listed below in your file and import the <i>../../src/assets/sass/theme/_theme.scss</i> file.</li>
					<li>Include the generated theme to your application.</li>
				</ul>

				<p>Here are the variables required to create a theme.</p>

<pre v-code.css><code>
$primaryColor: #2196F3 !default;
$primaryLightColor: scale-color($primaryColor, $lightness: 60%) !default;
$primaryDarkColor: scale-color($primaryColor, $lightness: -10%) !default;
$primaryDarkerColor: scale-color($primaryColor, $lightness: -20%) !default;
$primaryTextColor: #ffffff !default;

$highlightBg: $primaryColor;
$highlightTextColor: $primaryTextColor;

@import "../../src/assets/sass/theme/_theme";

</code></pre>

                <p>If you prefer to compile manually instead of adding it to your bundle with an import, an example sass command to compile the css is;</p>

<pre v-code><code>
sass public/theme/theme-myown.scss:public/theme/theme-myown.css

</code></pre>

                <p>Watch mode is handy to avoid compiling everytime when a change is made, instead use the following command
                so that sass generates the file whenever you make a customization. This builds all css files whenever a change is made to any scss file.</p>
<pre v-code><code>
sass --update public/layout/css:public/layout/css
sass --update public/theme:public/theme

</code></pre>

                <h4>Layout Theme</h4>
				<p>Prestige offers 48 built-in theme alternatives for the layout which is enabled by including the layout-*.css file to the project such as <i>layout-blue.css.</i></p>

                <ul>
					<li>amber</li>
					<li>amethyst</li>
					<li>aqua</li>
					<li>arecaceae</li>
					<li>blue</li>
					<li>bluegray</li>
					<li>brown</li>
					<li>canvas</li>
					<li>cross</li>
					<li>cyan</li>
					<li>deeporange</li>
					<li>deeppurple</li>
					<li>dream</li>
                    <li>emerald</li>
                    <li>fate</li>
                    <li>focus</li>
                    <li>forest</li>
                    <li>fractal</li>
                    <li>gem</li>
                    <li>grass</li>
                    <li>green</li>
                    <li>indigo</li>
                    <li>jungfraujoch</li>
                    <li>lightblue</li>
                    <li>lightgreen</li>
                    <li>lime</li>
                    <li>mackenzie</li>
                    <li>marble</li>
                    <li>madrid</li>
                    <li>metro</li>
                    <li>midnight</li>
                    <li>milan</li>
                    <li>mist</li>
                    <li>orange</li>
                    <li>osterreich</li>
                    <li>palm</li>
                    <li>pink</li>
                    <li>polygon</li>
                    <li>purple</li>
                    <li>rhyme</li>
                    <li>sand</li>
                    <li>smoke</li>
                    <li>soul</li>
                    <li>steel</li>
                    <li>stone</li>
                    <li>teal</li>
                    <li>wood</li>
                    <li>yellow</li>
				</ul>

                <p>A custom layout theme can be developed by the following steps.</p>
                <ul>
                    <li>Choose a layout name such as layout-myown.</li>
                    <li>Create an empty file named layout-myown.scss inside <i>public/layout/css</i> folder.</li>
                    <li>Define the variables listed below and import the <i>../../../src/assets/sass/layout/_layout.scss</i>.</li>
                    <li>Build the scss to generate css</li>
                    <li>Include the generated theme to your application.</li>
                </ul>

                <p>Here are the variables required to create a layout;</p>

<pre v-code.css><code>
$primaryLighterColor:#BBDEFB;
$primaryColor:#1E88E5;
$primaryDarkerColor:#0D47A1;
$primaryTextColor:#ffffff;

/* background */
$backgroundLeftColor:$primaryColor;
$backgroundRightColor:$primaryDarkerColor;

/* horizontal menu */
$horizontalMenuItemBgColor: rgba(255,255,255,0.2);
$horizontalMenuItemTextColor: rgba(255,255,255,0.72);
$horizontalMenuItemHoverBgColor: rgba(255,255,255,0.3);
$horizontalMenuItemHoverTextColor: rgba(255,255,255,1);

/* topbar */
$topbarItemBgColor:rgba(255,255,255,0.2);
$topbarItemTextColor:rgba(255,255,255,0.72);
$topbarItemHoverBgColor:rgba(255,255,255,0.2);
$topbarUserProfileTextColor:rgba(255,255,255,0.72);

/* overlay menu */
$overlayMenuItemHoverBgColor:$primaryLighterColor;
$overlayMenuItemActiveTextColor:$primaryDarkerColor;

/* overlay menu button */
$overlayMenuButtonColor:$primaryDarkerColor;
$overlayMenuButtonHoverBgColor:$primaryLighterColor;

//footer
$footerTextColor:rgba(255,255,255,0.7);
$footerTextHoverColor:rgba(255,255,255,1);

@import "../../../src/assets/sass/layout/_layout";

</code></pre>

				<p>If you prefer to use an image for the background, use the variables below. Notice the replacement of <i>$backgroundLeftColor</i> and <i>$backgroundRightColor</i> with <i>$backgroundImage</i>.</p>

<pre v-code.css><code>
$primaryLighterColor:#CFD8DC;
$primaryColor:#455A64;
$primaryDarkerColor:#263238;
$primaryTextColor:#ffffff;

/* background */
$backgroundImage:"palm.jpg";

/* horizontal menu */
$horizontalMenuItemBgColor: rgba(255,255,255,0.2);
$horizontalMenuItemTextColor: rgba(255,255,255,0.72);
$horizontalMenuItemHoverBgColor: rgba(255,255,255,0.3);
$horizontalMenuItemHoverTextColor: rgba(255,255,255,1);

/* topbar */
$topbarItemBgColor:rgba(255,255,255,0.2);
$topbarItemTextColor:rgba(255,255,255,0.72);
$topbarItemHoverBgColor:rgba(255,255,255,0.2);
$topbarUserProfileTextColor:rgba(255,255,255,0.72);

/* overlay menu */
$overlayMenuItemHoverBgColor:$primaryLighterColor;
$overlayMenuItemActiveTextColor:$primaryDarkerColor;

/* overlay menu button */
$overlayMenuButtonColor:$primaryDarkerColor;
$overlayMenuButtonHoverBgColor:$primaryLighterColor;

//footer
$footerTextColor:rgba(255,255,255,0.7);
$footerTextHoverColor:rgba(255,255,255,1);

@import "../../../src/assets/sass/layout/_layout";

</code></pre>

                <h4>Common SASS Variables</h4>
				<p>Layout and Theme have their own variables file that is shared between each layout and component themes respectively. In addition, the main variables file defines the common configuration.</p>

				<h5>src/assets/sass/layout/_variables.scss</h5>
<pre v-code.css><code>
$fontFamily:"Sarabun",sans-serif;
$fontSize:14px;
$textColor:#495057;
$textSecondaryColor:#6c757d;
$borderRadius:3px;
$transitionDuration:.2s;

$bodyPadding:25px 50px;
$normalBodyPadding:25px 0px;
$mobileBodyPadding:5px 15px;
$contentBgColor:#f2f2f2;
$responsiveLayoutBreakpoint:991px;
$maskBgColor:#24262e;
$dividerColor:#dee2e6;

/* horizontal menu */
$horizontalMenuItemActiveBgColor: #ffffff;
$horizontalMenuItemActiveTextColor: #1b1c1e;

/* overlay menu */
$overlayMenuBgColor:#ffffff;
$overlayMenuShadow:0 2px 4px 0 rgba(0, 0, 0, 0.3);
$overlayMenuItemTextColor:#313842;
$overlayMenuItemBorderRadius:3px;

/* actionbar */
$actionItemBgColor:#f8f9fa;
$actionItemIconColor:#757575;
$actionItemHoverBgColor:#e9ecef;

/* mobile menu */
$mobileMenuBgColor:#24262e;
$mobileMenuItemBgColor: rgba(255, 255, 255, 0.2);
$mobileMenuItemHoverBgColor: rgba(255,255,255, 0.4);
$mobileMenuItemActiveBgColor:#ffffff;
$mobileMenuItemTextColor:rgba(255,255,255,0.72);
$mobileMenuItemActiveTextColor:#1b1c1e;

/* tooltip */
$tooltipBgColor:#313842;
$tooltipColor:#ffffff;

/* user profile menu */
$userProfileMenuInfoBgColor:#f9fafc;
$userProfileMenuInfoNameTextColor:#646a74;
$userProfileMenuInfoRoleTextColor:#313842;
$userProfileMenuLinkIconColor:#9ba8b8;
$userProfileMenuLinkItemTitleColor:#313842;
$userProfileMenuLinkItemSubTitleColor:#457fca;

//actionbar
$actionBarBgColor:#ffffff;
$breadcrumbSeparatorColor:rgba(176, 186, 196, 0.4);
$breadcrumbItemTextColor:#313842;
$breadcrumbLinkTextColor:#b0bac4;
$breadcrumbLinkHoverTextColor:#3ca4e7;

//misc
$cardBgColor:#ffffff;
$cardBorder:solid 1px #dfe6ee;

</code></pre>

				<h5>src/assets/sass/theme/_variables.scss</h5>
<div style="height:400px;overflow: auto;">
<pre v-code.css><code>
$colors: (
    "blue": #2196F3,
    "green": #4caf50,
    "yellow": #FBC02D,
    "cyan": #00BCD4,
    "pink": #E91E63,
    "indigo": #3F51B5,
    "teal": #009688,
    "orange": #F57C00,
    "bluegray": #607D8B,
    "purple": #9C27B0
);

//reused color variables
$shade000:#ffffff !default;    //surface
$shade100:#f8f9fa !default;    //header background
$shade200:#e9ecef !default;    //hover background
$shade300:#dee2e6 !default;    //border, divider
$shade400:#ced4da !default;    //input border
$shade500:#adb5bd !default;    //input icon
$shade600:#6c757d !default;    //text secondary color
$shade700:#495057 !default;    //text color
$shade800:#343a40 !default;    //unused
$shade900:#212529 !default;    //unused

//global
$fontFamily:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !default;
$fontSize:1rem !default;
$fontWeight:normal !default;
$textColor:$shade700 !default;
$textSecondaryColor:$shade600 !default;
$borderRadius:3px !default;
$transitionDuration:.2s !default;
$formElementTransition:background-color $transitionDuration, color $transitionDuration, border-color $transitionDuration, box-shadow $transitionDuration !default;
$actionIconTransition:background-color $transitionDuration, color $transitionDuration, box-shadow $transitionDuration !default;
$listItemTransition:box-shadow $transitionDuration !default;
$primeIconFontSize:1rem !default;
$divider:1px solid $shade300 !default;
$inlineSpacing:.5rem !default;
$disabledOpacity:.6 !default;
$maskBg:rgba(0, 0, 0, 0.4) !default;
$loadingIconFontSize:2rem !default;
$errorColor:#f44336 !default;

//scale
$scaleSM:0.875 !default;
$scaleLG:1.25 !default;

//focus
$focusOutlineColor:$primaryLightColor !default;
$focusOutline:0 none !default;
$focusOutlineOffset:0 !default;
$focusShadow:0 0 0 0.2rem $focusOutlineColor !default;

//action icons
$actionIconWidth:2rem !default;
$actionIconHeight:2rem !default;
$actionIconBg:transparent !default;
$actionIconBorder:0 none !default;
$actionIconColor:$shade600 !default;
$actionIconHoverBg:$shade200 !default;
$actionIconHoverBorderColor:transparent !default;
$actionIconHoverColor:$shade700 !default;
$actionIconBorderRadius:50% !default;

//input field (e.g. inputtext, spinner, inputmask)
$inputPadding:.5rem .5rem !default;
$inputTextFontSize:1rem !default;
$inputBg:$shade000 !default;
$inputTextColor:$shade700 !default;
$inputIconColor:$shade600 !default;
$inputBorder:1px solid $shade400 !default;
$inputHoverBorderColor:$primaryColor !default;
$inputFocusBorderColor:$primaryColor !default;
$inputErrorBorderColor:$errorColor !default;
$inputPlaceholderTextColor:$shade600 !default;
$inputFilledBg:$shade100 !default;
$inputFilledHoverBg:$inputFilledBg !default;
$inputFilledFocusBg:$shade000 !default;

//input groups
$inputGroupBg:$shade200 !default;
$inputGroupTextColor:$shade600 !default;
$inputGroupAddOnMinWidth:2.357rem !default;

//input lists (e.g. dropdown, autocomplete, multiselect, orderlist)
$inputListBg:$shade000 !default;
$inputListTextColor:$shade700 !default;
$inputListBorder:$inputBorder !default;
$inputListPadding:.5rem 0 !default;
$inputListItemPadding:.5rem 1rem !default;
$inputListItemBg:transparent !default;
$inputListItemTextColor:$shade700 !default;
$inputListItemHoverBg:$shade200 !default;
$inputListItemTextHoverColor:$shade700 !default;
$inputListItemBorder:0 none !default;
$inputListItemBorderRadius:0 !default;
$inputListItemMargin:0 !default;
$inputListItemFocusShadow:inset 0 0 0 0.15rem $focusOutlineColor !default;
$inputListHeaderPadding:.5rem 1rem !default;
$inputListHeaderMargin:0 !default;
$inputListHeaderBg:$shade100 !default;
$inputListHeaderTextColor:$shade700 !default;
$inputListHeaderBorder:0 none !default;

//inputs with overlays (e.g. autocomplete, dropdown, multiselect)
$inputOverlayBg:$inputListBg !default;
$inputOverlayHeaderBg:$inputListHeaderBg !default;
$inputOverlayBorder:0 none !default;                  
$inputOverlayShadow:0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12) !default;

//password
$passwordMeterBg:$shade300 !default;
$passwordWeakBg:#D32F2F !default;
$passwordMediumBg:#FBC02D !default;
$passwordStrongBg:#689F38 !default;

//button
$buttonPadding:.5rem 1rem !default;
$buttonIconOnlyWidth:2.357rem !default;
$buttonIconOnlyPadding:.5rem 0 !default;
$buttonBg:$primaryColor !default;
$buttonTextColor:$primaryTextColor !default;
$buttonBorder:1px solid $primaryColor !default;
$buttonHoverBg:$primaryDarkColor !default;
$buttonTextHoverColor:$primaryTextColor !default;
$buttonHoverBorderColor:$primaryDarkColor !default;
$buttonActiveBg:$primaryDarkerColor !default;
$buttonTextActiveColor:$primaryTextColor !default;
$buttonActiveBorderColor:$primaryDarkerColor !default;
$raisedButtonShadow:0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12) !default;
$roundedButtonBorderRadius:2rem !default;

$textButtonHoverBgOpacity:.04 !default;
$textButtonActiveBgOpacity:.16 !default;
$outlinedButtonBorder:1px solid !default;
$plainButtonTextColor:$textSecondaryColor !default;
$plainButtonHoverBgColor:$shade200 !default;
$plainButtonActiveBgColor:$shade300 !default;

$secondaryButtonBg:#607D8B !default;
$secondaryButtonTextColor:#ffffff !default;
$secondaryButtonBorder:1px solid $secondaryButtonBg !default;
$secondaryButtonHoverBg:scale-color($secondaryButtonBg, $lightness: -10%) !default;
$secondaryButtonTextHoverColor:$secondaryButtonTextColor !default;
$secondaryButtonHoverBorderColor:scale-color($secondaryButtonBg, $lightness: -10%) !default;
$secondaryButtonActiveBg:scale-color($secondaryButtonBg, $lightness: -20%) !default;
$secondaryButtonTextActiveColor:$secondaryButtonTextColor !default;
$secondaryButtonActiveBorderColor:scale-color($secondaryButtonBg, $lightness: -20%) !default;
$secondaryButtonFocusShadow:0 0 0 0.2rem scale-color($secondaryButtonBg, $lightness: 60%) !default;

$infoButtonBg:#0288D1 !default;
$infoButtonTextColor:#ffffff !default;
$infoButtonBorder:1px solid $infoButtonBg !default;
$infoButtonHoverBg:scale-color($infoButtonBg, $lightness: -10%) !default;
$infoButtonTextHoverColor:$infoButtonTextColor !default;
$infoButtonHoverBorderColor:scale-color($infoButtonBg, $lightness: -10%) !default;
$infoButtonActiveBg:scale-color($infoButtonBg, $lightness: -20%) !default;
$infoButtonTextActiveColor:$infoButtonTextColor !default;
$infoButtonActiveBorderColor:scale-color($infoButtonBg, $lightness: -20%) !default;
$infoButtonFocusShadow:0 0 0 0.2rem scale-color($infoButtonBg, $lightness: 60%) !default;

$successButtonBg:#689F38 !default;
$successButtonTextColor:#ffffff !default;
$successButtonBorder:1px solid $successButtonBg !default;
$successButtonHoverBg:scale-color($successButtonBg, $lightness: -10%) !default;
$successButtonTextHoverColor:$successButtonTextColor !default;
$successButtonHoverBorderColor:scale-color($successButtonBg, $lightness: -10%) !default;
$successButtonActiveBg:scale-color($successButtonBg, $lightness: -20%) !default;
$successButtonTextActiveColor:$successButtonTextColor !default;
$successButtonActiveBorderColor:scale-color($successButtonBg, $lightness: -20%) !default;
$successButtonFocusShadow:0 0 0 0.2rem scale-color($successButtonBg, $lightness: 60%) !default;

$warningButtonBg:#FBC02D !default;
$warningButtonTextColor:#212529 !default;
$warningButtonBorder:1px solid $warningButtonBg !default;
$warningButtonHoverBg:scale-color($warningButtonBg, $lightness: -10%) !default;
$warningButtonTextHoverColor:$warningButtonTextColor !default;
$warningButtonHoverBorderColor:scale-color($warningButtonBg, $lightness: -10%) !default;
$warningButtonActiveBg:scale-color($warningButtonBg, $lightness: -20%) !default;
$warningButtonTextActiveColor:$warningButtonTextColor !default;
$warningButtonActiveBorderColor:scale-color($warningButtonBg, $lightness: -20%) !default;
$warningButtonFocusShadow:0 0 0 0.2rem scale-color($warningButtonBg, $lightness: 60%) !default;

$helpButtonBg:#9C27B0 !default;
$helpButtonTextColor:#ffffff !default;
$helpButtonBorder:1px solid $helpButtonBg !default;
$helpButtonHoverBg:scale-color($helpButtonBg, $lightness: -10%) !default;
$helpButtonTextHoverColor:$helpButtonTextColor !default;
$helpButtonHoverBorderColor:scale-color($helpButtonBg, $lightness: -10%) !default;
$helpButtonActiveBg:scale-color($helpButtonBg, $lightness: -20%) !default;
$helpButtonTextActiveColor:$helpButtonTextColor !default;
$helpButtonActiveBorderColor:scale-color($helpButtonBg, $lightness: -20%) !default;
$helpButtonFocusShadow:0 0 0 0.2rem scale-color($helpButtonBg, $lightness: 60%) !default;

$dangerButtonBg:#D32F2F !default;
$dangerButtonTextColor:#ffffff !default;
$dangerButtonBorder:1px solid $dangerButtonBg !default;
$dangerButtonHoverBg:scale-color($dangerButtonBg, $lightness: -10%) !default;
$dangerButtonTextHoverColor:$dangerButtonTextColor !default;
$dangerButtonHoverBorderColor:scale-color($dangerButtonBg, $lightness: -10%) !default;
$dangerButtonActiveBg:scale-color($dangerButtonBg, $lightness: -20%) !default;
$dangerButtonTextActiveColor:$dangerButtonTextColor !default;
$dangerButtonActiveBorderColor:scale-color($dangerButtonBg, $lightness: -20%) !default;
$dangerButtonFocusShadow:0 0 0 0.2rem scale-color($dangerButtonBg, $lightness: 60%) !default;

$linkButtonColor:$primaryDarkerColor !default;
$linkButtonHoverColor:$primaryDarkerColor !default;
$linkButtonTextHoverDecoration:underline !default;
$linkButtonFocusShadow:0 0 0 0.2rem $focusOutlineColor !default;

//checkbox
$checkboxWidth:20px !default;
$checkboxHeight:20px !default;
$checkboxBorder:2px solid $shade400 !default;
$checkboxIconFontSize:14px !default;
$checkboxActiveBorderColor:$primaryColor !default;
$checkboxActiveBg:$primaryColor !default;
$checkboxIconActiveColor:$primaryTextColor !default;
$checkboxActiveHoverBg:$primaryDarkerColor !default;
$checkboxIconActiveHoverColor:$primaryTextColor !default;
$checkboxActiveHoverBorderColor:$primaryDarkerColor !default;

//radiobutton
$radiobuttonWidth:20px !default;
$radiobuttonHeight:20px !default;
$radiobuttonBorder:2px solid $shade400 !default;
$radiobuttonIconSize:12px !default;
$radiobuttonActiveBorderColor:$primaryColor !default;
$radiobuttonActiveBg:$primaryColor !default;
$radiobuttonIconActiveColor:$primaryTextColor !default;
$radiobuttonActiveHoverBg:$primaryDarkerColor !default;
$radiobuttonIconActiveHoverColor:$primaryTextColor !default;
$radiobuttonActiveHoverBorderColor:$primaryDarkerColor !default;

//colorpicker
$colorPickerPreviewWidth:2rem !default;
$colorPickerPreviewHeight:2rem !default;
$colorPickerBg:#323232 !default;
$colorPickerBorderColor:#191919 !default;
$colorPickerHandleColor:$shade000 !default;

//togglebutton
$toggleButtonBg:$inputBg !default;
$toggleButtonBorder:1px solid $shade400 !default;
$toggleButtonTextColor:$shade700 !default;
$toggleButtonIconColor:$shade600 !default;
$toggleButtonHoverBg:$shade200 !default;
$toggleButtonHoverBorderColor:$shade400 !default;
$toggleButtonTextHoverColor:$shade700 !default;
$toggleButtonIconHoverColor:$shade600 !default;
$toggleButtonActiveBg:$primaryColor !default;
$toggleButtonActiveBorderColor:$primaryColor !default;
$toggleButtonTextActiveColor:$primaryTextColor !default;
$toggleButtonIconActiveColor:$primaryTextColor !default;
$toggleButtonActiveHoverBg:$primaryDarkColor !default;
$toggleButtonActiveHoverBorderColor:$primaryDarkColor !default;
$toggleButtonTextActiveHoverColor:$primaryTextColor !default;
$toggleButtonIconActiveHoverColor:$primaryTextColor !default;

//inplace
$inplacePadding:$inputPadding !default;
$inplaceHoverBg:$shade200 !default;
$inplaceTextHoverColor:$shade700 !default;

//rating
$ratingIconFontSize:1.143rem !default;
$ratingCancelIconColor:#e74c3c !default;
$ratingCancelIconHoverColor:#c0392b !default;
$ratingStarIconOffColor:$shade700 !default;
$ratingStarIconOnColor:$primaryColor !default;
$ratingStarIconHoverColor:$primaryColor !default;

//slider
$sliderBg:$shade300 !default;
$sliderBorder:0 none !default;
$sliderHorizontalHeight:.286rem !default;
$sliderVerticalWidth:0.286rem !default;
$sliderHandleWidth:1.143rem !default;
$sliderHandleHeight:1.143rem !default;
$sliderHandleBg:$shade000 !default;
$sliderHandleBorder:2px solid $primaryColor !default;
$sliderHandleBorderRadius:50% !default;
$sliderHandleHoverBorderColor:$primaryColor !default;
$sliderHandleHoverBg:$primaryColor !default;
$sliderRangeBg:$primaryColor !default;

//calendar
$calendarTableMargin:.5rem 0 !default;
$calendarPadding:.5rem !default;
$calendarBg:$shade000 !default;
$calendarInlineBg:$calendarBg !default;
$calendarTextColor:$shade700 !default;
$calendarBorder:$inputListBorder !default;
$calendarOverlayBorder:$inputOverlayBorder !default;

$calendarHeaderPadding:.5rem !default;
$calendarHeaderBg:$shade000 !default;
$calendarInlineHeaderBg:$calendarBg !default;
$calendarHeaderBorder:1px solid $shade300 !default;
$calendarHeaderTextColor:$shade700 !default;
$calendarHeaderFontWeight:600 !default;
$calendarHeaderCellPadding:.5rem !default;

$calendarCellDatePadding:.5rem !default;
$calendarCellDateWidth:2.5rem !default;
$calendarCellDateHeight:2.5rem !default;
$calendarCellDateBorderRadius:50% !default;
$calendarCellDateBorder:1px solid transparent !default;
$calendarCellDateHoverBg:$shade200 !default;
$calendarCellDateTodayBg:$shade400 !default;
$calendarCellDateTodayBorderColor:transparent !default;
$calendarCellDateTodayTextColor:$shade700 !default;

$calendarButtonBarPadding:1rem 0 !default;
$calendarTimePickerPadding:.5rem !default;
$calendarTimePickerElementPadding:0 .5rem !default;
$calendarTimePickerTimeFontSize:1.25rem !default;

$calendarBreakpoint:769px !default;
$calendarCellDatePaddingSM:0 !default;

//input switch
$inputSwitchWidth:3rem !default;
$inputSwitchHeight:1.75rem !default;
$inputSwitchBorderRadius:30px !default;
$inputSwitchHandleWidth:1.250rem !default;
$inputSwitchHandleHeight:1.250rem !default;
$inputSwitchHandleBorderRadius:50% !default;
$inputSwitchSliderPadding:.25rem !default;
$inputSwitchSliderOffBg:$shade400 !default;
$inputSwitchHandleOffBg:$shade000 !default;
$inputSwitchSliderOffHoverBg:scale-color($shade400, $lightness: -10%) !default;
$inputSwitchSliderOnBg:$primaryColor !default;
$inputSwitchSliderOnHoverBg:$primaryDarkColor !default;
$inputSwitchHandleOnBg:$shade000 !default;

//panel
$panelHeaderBorderColor:$shade300 !default;
$panelHeaderBorder:1px solid $shade300 !default;
$panelHeaderBg:$shade100 !default;
$panelHeaderTextColor:$shade700 !default;
$panelHeaderFontWeight:600 !default;
$panelHeaderPadding:1rem !default;
$panelToggleableHeaderPadding:.5rem 1rem !default;

$panelHeaderHoverBg:$shade200 !default;
$panelHeaderHoverBorderColor:$shade300 !default;
$panelHeaderTextHoverColor:$shade700 !default;

$panelContentBorderColor: $shade300 !default;
$panelContentBorder:1px solid $shade300 !default;
$panelContentBg:$shade000 !default;
$panelContentTextColor:$shade700 !default;
$panelContentPadding:1rem !default;

$panelFooterBorder:1px solid $shade300 !default;
$panelFooterBg:$shade000 !default;
$panelFooterTextColor:$shade700 !default;
$panelFooterPadding:0.5rem 1rem !default;

//accordion
$accordionSpacing:0 !default;
$accordionHeaderBorder:$panelHeaderBorder !default;
$accordionHeaderBg:$panelHeaderBg !default;
$accordionHeaderTextColor:$panelHeaderTextColor !default;
$accordionHeaderFontWeight:$panelHeaderFontWeight !default;
$accordionHeaderPadding:$panelHeaderPadding !default;

$accordionHeaderHoverBg:$shade200 !default;
$accordionHeaderHoverBorderColor:$shade300 !default;
$accordionHeaderTextHoverColor:$shade700 !default;

$accordionHeaderActiveBg:$panelHeaderBg !default;
$accordionHeaderActiveBorderColor:$shade300 !default;
$accordionHeaderTextActiveColor:$shade700 !default;

$accordionHeaderActiveHoverBg:$shade200 !default;
$accordionHeaderActiveHoverBorderColor:$shade300 !default;
$accordionHeaderTextActiveHoverColor:$shade700 !default;

$accordionContentBorder:$panelContentBorder !default;
$accordionContentBg:$panelContentBg !default;
$accordionContentTextColor:$panelContentTextColor !default;
$accordionContentPadding:$panelContentPadding !default;

//tabview
$tabviewNavBorder:1px solid $shade300 !default;
$tabviewNavBorderWidth:0 0 2px 0 !default;
$tabviewNavBg:$shade000 !default;

$tabviewHeaderSpacing:0 !default;
$tabviewHeaderBorder:solid $shade300 !default;
$tabviewHeaderBorderWidth:0 0 2px 0 !default;
$tabviewHeaderBorderColor:transparent transparent $shade300 transparent !default;
$tabviewHeaderBg:$shade000 !default;
$tabviewHeaderTextColor:$shade600 !default;
$tabviewHeaderFontWeight:$panelHeaderFontWeight !default;
$tabviewHeaderPadding:$panelHeaderPadding !default;
$tabviewHeaderMargin:0 0 -2px 0 !default;

$tabviewHeaderHoverBg:$shade000 !default;
$tabviewHeaderHoverBorderColor:$shade600 !default;
$tabviewHeaderTextHoverColor:$shade600 !default;

$tabviewHeaderActiveBg:$shade000 !default;
$tabviewHeaderActiveBorderColor:$primaryColor !default;
$tabviewHeaderTextActiveColor:$primaryColor !default;

$tabviewContentBorder:0 none !default;
$tabviewContentBg:$panelContentBg !default;
$tabviewContentTextColor:$panelContentTextColor !default;
$tabviewContentPadding:$panelContentPadding !default;

//upload
$fileUploadProgressBarHeight:.25rem !default;
$fileUploadContentPadding:2rem 1rem !default;

//scrollpanel
$scrollPanelTrackBorder:0 none !default;
$scrollPanelTrackBg:$shade100 !default;

//card
$cardBodyPadding:1rem !default;
$cardTitleFontSize:1.5rem !default;
$cardTitleFontWeight:700 !default;
$cardSubTitleFontWeight:400 !default;
$cardSubTitleColor:$shade600 !default;
$cardContentPadding:1rem 0 !default;
$cardFooterPadding:1rem 0 0 0 !default;
$cardShadow:0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12) !default;

//editor
$editorToolbarBg:$panelHeaderBg !default;
$editorToolbarBorder:$panelHeaderBorder !default;
$editorToolbarPadding:$panelHeaderPadding !default;
$editorToolbarIconColor:$textSecondaryColor !default;
$editorToolbarIconHoverColor:$textColor !default;
$editorIconActiveColor:$primaryColor !default;
$editorContentBorder:$panelContentBorder !default;
$editorContentBg:$panelContentBg !default;

//paginator
$paginatorBg:$shade000 !default;
$paginatorTextColor:$shade600 !default;
$paginatorBorder:solid $shade200 !default;
$paginatorBorderWidth:0 !default;
$paginatorPadding:.5rem 1rem !default;
$paginatorElementWidth:$buttonIconOnlyWidth !default;
$paginatorElementHeight:$buttonIconOnlyWidth !default;
$paginatorElementBg:transparent !default;
$paginatorElementBorder:0 none !default;
$paginatorElementIconColor:$shade600 !default;
$paginatorElementHoverBg:$shade200 !default;
$paginatorElementHoverBorderColor:transparent !default;
$paginatorElementIconHoverColor:$shade700 !default;
$paginatorElementBorderRadius:$borderRadius !default;
$paginatorElementMargin:.143rem !default;
$paginatorElementPadding:0 !default;

//table
$tableHeaderBorder:1px solid $shade200 !default;
$tableHeaderBorderWidth:1px 0 1px 0 !default;
$tableHeaderBg:$shade100 !default;
$tableHeaderTextColor:$shade700 !default;
$tableHeaderFontWeight:600 !default;
$tableHeaderPadding:1rem 1rem !default;

$tableHeaderCellPadding:1rem 1rem !default;
$tableHeaderCellBg:$shade100 !default;
$tableHeaderCellTextColor:$shade700 !default;
$tableHeaderCellFontWeight:600 !default;
$tableHeaderCellBorder:1px solid $shade200 !default;
$tableHeaderCellBorderWidth:0 0 1px 0 !default;
$tableHeaderCellHoverBg:$shade200 !default;
$tableHeaderCellTextHoverColor:$shade700 !default;
$tableHeaderCellIconColor:$shade600 !default;
$tableHeaderCellIconHoverColor:$shade600 !default;
$tableHeaderCellHighlightBg:$shade100 !default;
$tableHeaderCellHighlightTextColor:$primaryColor !default;
$tableHeaderCellHighlightHoverBg:$shade200 !default;
$tableHeaderCellHighlightTextHoverColor:$primaryColor !default;
$tableSortableColumnBadgeSize:1.143rem !default;

$tableBodyRowBg:$shade000 !default;
$tableBodyRowTextColor:$shade700 !default;
$tableBodyRowEvenBg:scale-color($tableBodyRowBg, $lightness: -1%) !default;
$tableBodyRowHoverBg:$shade200 !default;
$tableBodyRowTextHoverColor:$shade700 !default;
$tableBodyCellBorder:1px solid $shade200 !default;
$tableBodyCellBorderWidth:0 0 1px 0 !default;
$tableBodyCellPadding:1rem 1rem !default;

$tableFooterCellPadding:1rem 1rem !default;
$tableFooterCellBg:$shade100 !default;
$tableFooterCellTextColor:$shade700 !default;
$tableFooterCellFontWeight:600 !default;
$tableFooterCellBorder:1px solid $shade200 !default;
$tableFooterCellBorderWidth:0 0 1px 0 !default;
$tableResizerHelperBg:$primaryColor !default;

$tableFooterBorder:1px solid $shade200 !default;
$tableFooterBorderWidth:0 0 1px 0 !default;
$tableFooterBg:$shade100 !default;
$tableFooterTextColor:$shade700 !default;
$tableFooterFontWeight:600 !default;
$tableFooterPadding:1rem 1rem !default;

$tableCellContentAlignment:left !default;
$tableTopPaginatorBorderWidth:0 0 1px 0 !default;
$tableBottomPaginatorBorderWidth:0 0 1px 0 !default;

$tableScaleSM:0.5 !default;
$tableScaleLG:1.25 !default;

//dataview
$dataViewContentPadding:0 !default;
$dataViewContentBorder:0 none !default;
$dataViewListItemBorder:solid $shade200 !default;
$dataViewListItemBorderWidth:0 0 1px 0 !default;

//schedule
$fullCalendarEventBg:$primaryDarkColor !default;
$fullCalendarEventBorderColor: $primaryDarkColor !default;
$fullCalendarEventBorder:1px solid $primaryDarkColor !default;
$fullCalendarEventTextColor:$primaryTextColor !default;

//tree
$treeContainerPadding:0.286rem !default;
$treeNodePadding:0.143rem !default;
$treeNodeContentPadding:0 !default;
$treeNodeChildrenPadding:0 0 0 1rem !default;
$treeNodeIconColor:$shade600 !default;

//timeline
$timelineVerticalEventContentPadding:0 1rem !default;
$timelineHorizontalEventContentPadding:1rem 0 !default;
$timelineEventMarkerWidth:1rem !default;
$timelineEventMarkerHeight:1rem !default;
$timelineEventMarkerBorderRadius:50% !default;
$timelineEventMarkerBorder:2px solid $primaryColor !default;
$timelineEventMarkerBackground:$shade000 !default;
$timelineEventConnectorSize:2px !default;
$timelineEventColor:$shade300 !default;

//org chart
$organizationChartConnectorColor:$shade300 !default;

//message
$messageMargin:1rem 0 !default;
$messagePadding:1rem 1.5rem !default;
$messageBorderWidth:0 0 0 6px !default;
$messageIconFontSize:1.5rem !default;
$messageTextFontSize:1rem !default;
$messageTextFontWeight:500 !default;

//inline message
$inlineMessagePadding:$inputPadding !default;
$inlineMessageMargin:0 !default;
$inlineMessageIconFontSize:1rem !default;
$inlineMessageTextFontSize:1rem !default;
$inlineMessageBorderWidth:0px !default;

//toast
$toastIconFontSize:2rem !default;
$toastMessageTextMargin:0 0 0 1rem !default;
$toastMargin:0 0 1rem 0 !default;
$toastPadding:1rem !default;
$toastBorderWidth:0 0 0 6px !default;
$toastShadow:0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12) !default;
$toastOpacity:.9 !default;
$toastTitleFontWeight:700 !default;
$toastDetailMargin:$inlineSpacing 0 0 0 !default;

//severities
$infoMessageBg:#B3E5FC !default;
$infoMessageBorder:solid scale-color($infoMessageBg, $lightness: -50%) !default;
$infoMessageTextColor:scale-color($infoMessageBg, $lightness: -75%) !default;
$infoMessageIconColor:scale-color($infoMessageBg, $lightness: -75%) !default;
$successMessageBg:#C8E6C9 !default;
$successMessageBorder:solid scale-color($successMessageBg, $lightness: -50%) !default;
$successMessageTextColor:scale-color($successMessageBg, $lightness: -75%) !default;
$successMessageIconColor:scale-color($successMessageBg, $lightness: -75%) !default;
$warningMessageBg:#FFECB3 !default;
$warningMessageBorder:solid scale-color($warningMessageBg, $lightness: -50%) !default;
$warningMessageTextColor:scale-color($warningMessageBg, $lightness: -75%) !default;
$warningMessageIconColor:scale-color($warningMessageBg, $lightness: -75%) !default;
$errorMessageBg:#FFCDD2 !default;
$errorMessageBorder:solid scale-color($errorMessageBg, $lightness: -50%) !default;
$errorMessageTextColor:scale-color($errorMessageBg, $lightness: -75%) !default;
$errorMessageIconColor:scale-color($errorMessageBg, $lightness: -75%) !default;

//overlays
$overlayContentBorder:0 none !default;
$overlayContentBg:$panelContentBg !default;
$overlayContainerShadow:0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0,0,0,.12) !default;

//dialog
$dialogHeaderBg:$shade000 !default;
$dialogHeaderBorder:0 none !default;
$dialogHeaderTextColor:$shade700 !default;
$dialogHeaderFontWeight:600 !default;
$dialogHeaderFontSize:1.25rem !default;
$dialogHeaderPadding:1.5rem !default;
$dialogContentPadding:0 1.5rem 2rem 1.5rem !default;
$dialogFooterBorder:0 none !default;
$dialogFooterPadding:0 1.5rem 1.5rem 1.5rem !default;

//confirmpopup
$confirmPopupContentPadding:$panelContentPadding !default;
$confirmPopupFooterPadding:0 1rem 1rem 1rem !default;

//tooltip
$tooltipBg:$shade700 !default;
$tooltipTextColor:$shade000 !default;
$tooltipPadding:$inputPadding !default;

//steps
$stepsItemBg:$shade000 !default;
$stepsItemBorder:1px solid $shade200 !default;
$stepsItemTextColor:$shade600 !default;
$stepsItemNumberWidth:2rem !default;
$stepsItemNumberHeight:2rem !default;
$stepsItemNumberFontSize:1.143rem !default;
$stepsItemNumberColor:$shade700 !default;
$stepsItemNumberBorderRadius:50% !default;
$stepsItemActiveFontWeight:600 !default;

//progressbar
$progressBarHeight:1.5rem !default;
$progressBarBorder:0 none !default;
$progressBarBg:$shade300 !default;
$progressBarValueBg:$primaryColor !default;

//menu (e.g. menu, menubar, tieredmenu)
$menuWidth:12.5rem !default;
$menuBg:$shade000 !default;
$menuBorder:1px solid $shade300 !default;
$menuTextColor:$shade700 !default;
$menuitemPadding:.75rem 1rem !default;
$menuitemBorderRadius:0 !default;
$menuitemTextColor:$shade700 !default;
$menuitemIconColor:$shade600 !default;
$menuitemTextHoverColor:$shade700 !default;
$menuitemIconHoverColor:$shade600 !default;
$menuitemHoverBg:$shade200 !default;
$menuitemTextActiveColor:$shade700 !default;
$menuitemIconActiveColor:$shade600 !default;
$menuitemActiveBg:$shade200 !default;
$menuitemSubmenuIconFontSize:.875rem !default;
$submenuHeaderMargin:0 !default;
$submenuHeaderPadding:.75rem 1rem !default;
$submenuHeaderBg:$shade000 !default;
$submenuHeaderTextColor:$shade700 !default;
$submenuHeaderBorderRadius:0 !default;
$submenuHeaderFontWeight:600 !default;
$overlayMenuBg:$menuBg !default;
$overlayMenuBorder:0 none !default;
$overlayMenuShadow:0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12) !default;
$verticalMenuPadding:.25rem 0 !default;
$menuSeparatorMargin:.25rem 0 !default;

$breadcrumbPadding:1rem !default;
$breadcrumbBg:$menuBg !default;
$breadcrumbBorder:$menuBorder !default;
$breadcrumbItemTextColor:$menuitemTextColor !default;
$breadcrumbItemIconColor:$menuitemIconColor !default;
$breadcrumbLastItemTextColor:$menuitemTextColor !default;
$breadcrumbLastItemIconColor:$menuitemIconColor !default;
$breadcrumbSeparatorColor:$menuitemTextColor !default;

$horizontalMenuPadding:.5rem !default;
$horizontalMenuBg:$shade100 !default;
$horizontalMenuBorder:$menuBorder !default;
$horizontalMenuTextColor:$menuTextColor !default;
$horizontalMenuRootMenuitemPadding:$menuitemPadding !default;
$horizontalMenuRootMenuitemBorderRadius:$borderRadius !default;
$horizontalMenuRootMenuitemTextColor:$menuitemTextColor !default;
$horizontalMenuRootMenuitemIconColor:$menuitemIconColor !default;
$horizontalMenuRootMenuitemTextHoverColor:$menuitemTextHoverColor !default;
$horizontalMenuRootMenuitemIconHoverColor:$menuitemIconHoverColor !default;
$horizontalMenuRootMenuitemHoverBg:$menuitemHoverBg !default;
$horizontalMenuRootMenuitemTextActiveColor:$menuitemTextActiveColor !default;
$horizontalMenuRootMenuitemIconActiveColor:$menuitemIconActiveColor !default;
$horizontalMenuRootMenuitemActiveBg:$menuitemActiveBg !default;

//badge and tag
$badgeBg:$primaryColor !default;
$badgeTextColor:$primaryTextColor !default;
$badgeMinWidth:1.5rem !default;
$badgeHeight:1.5rem !default;
$badgeFontWeight:700 !default;
$badgeFontSize:.75rem !default;

$tagPadding:.25rem .4rem !default;

//carousel
$carouselIndicatorsPadding:1rem !default;
$carouselIndicatorBg:$shade200 !default;
$carouselIndicatorHoverBg:$shade300 !default;
$carouselIndicatorBorderRadius:0 !default;
$carouselIndicatorWidth:2rem !default;
$carouselIndicatorHeight:.5rem !default;

//galleria
$galleriaMaskBg:rgba(0,0,0,0.9) !default;
$galleriaCloseIconMargin:.5rem !default;
$galleriaCloseIconFontSize:2rem !default;
$galleriaCloseIconBg:transparent !default;
$galleriaCloseIconColor:$shade100 !default;
$galleriaCloseIconHoverBg:rgba(255,255,255,0.1) !default;
$galleriaCloseIconHoverColor:$shade100 !default;
$galleriaCloseIconWidth:4rem !default;
$galleriaCloseIconHeight:4rem !default;
$galleriaCloseIconBorderRadius:50% !default;

$galleriaItemNavigatorBg:transparent !default;
$galleriaItemNavigatorColor:$shade100 !default;
$galleriaItemNavigatorMargin:0 .5rem !default;
$galleriaItemNavigatorFontSize:2rem !default;
$galleriaItemNavigatorHoverBg:rgba(255,255,255,0.1) !default;
$galleriaItemNavigatorHoverColor:$shade100 !default;
$galleriaItemNavigatorWidth:4rem !default;
$galleriaItemNavigatorHeight:4rem !default;
$galleriaItemNavigatorBorderRadius:$borderRadius !default;

$galleriaCaptionBg:rgba(0,0,0,.5) !default;
$galleriaCaptionTextColor:$shade100 !default;
$galleriaCaptionPadding:1rem !default;

$galleriaIndicatorsPadding:1rem !default;
$galleriaIndicatorBg:$shade200 !default;
$galleriaIndicatorHoverBg:$shade300 !default;
$galleriaIndicatorBorderRadius:50% !default;
$galleriaIndicatorWidth:1rem !default;
$galleriaIndicatorHeight:1rem !default;
$galleriaIndicatorsBgOnItem:rgba(0,0,0,.5) !default;
$galleriaIndicatorBgOnItem:rgba(255,255,255,.4) !default;
$galleriaIndicatorHoverBgOnItem:rgba(255,255,255,.6) !default;

$galleriaThumbnailContainerBg:rgba(0,0,0,.9) !default;
$galleriaThumbnailContainerPadding:1rem .25rem !default;
$galleriaThumbnailNavigatorBg:transparent !default;
$galleriaThumbnailNavigatorColor:$shade100 !default;
$galleriaThumbnailNavigatorHoverBg:rgba(255,255,255,0.1) !default;
$galleriaThumbnailNavigatorHoverColor:$shade100 !default;
$galleriaThumbnailNavigatorBorderRadius:50% !default;
$galleriaThumbnailNavigatorWidth:2rem !default;
$galleriaThumbnailNavigatorHeight:2rem !default;

//divider
$dividerHorizontalMargin:1rem 0 !default;
$dividerHorizontalPadding:0 1rem !default;
$dividerVerticalMargin:0 1rem !default;
$dividerVerticalPadding:1rem 0 !default;
$dividerSize:1px !default;
$dividerColor:$shade300 !default;

//avatar
$avatarBg:$shade300 !default;
$avatarTextColor:$textColor !default;

//chip
$chipBg:$shade300 !default;
$chipTextColor:$textColor !default;
$chipBorderRadius: 16px !default;

//scrollTop
$scrollTopBg:rgba(0,0,0,0.7) !default;
$scrollTopHoverBg:rgba(0,0,0,0.8) !default;
$scrollTopWidth:3rem !default;
$scrollTopHeight:3rem !default;
$scrollTopBorderRadius:50% !default;
$scrollTopFontSize:1.5rem !default;
$scrollTopTextColor:$shade100 !default;

//skeleton
$skeletonBg:$shade200 !default;
$skeletonAnimationBg:rgba(255,255,255,0.4) !default;

//splitter
$splitterGutterBg:$shade100 !default;
$splitterGutterHandleBg:$shade300 !default;

//speeddial
$speedDialButtonWidth: 4rem !default;
$speedDialButtonHeight: 4rem !default;
$speedDialButtonIconFontSize: 1.3rem !default;
$speedDialActionWidth: 3rem !default;
$speedDialActionHeight: 3rem !default;
$speedDialActionBg: $shade700 !default;
$speedDialActionHoverBg: $shade800 !default;
$speedDialActionTextColor: #fff !default;
$speedDialActionTextHoverColor: #fff !default;

//dock
$dockActionWidth: 4rem !default;
$dockActionHeight: 4rem !default;
$dockItemPadding: .5rem !default;
$dockCurrentItemMargin: 1.5rem !default;
$dockFirstItemsMargin: 1.3rem !default;
$dockSecondItemsMargin: 0.9rem !default;
$dockBg: rgba(255,255,255,.1) !default;
$dockBorder: 1px solid rgba(255,255,255,0.2) !default;
$dockPadding: .5rem .5rem !default;
$dockBorderRadius: .5rem !default;

//image
$imageMaskBg:rgba(0,0,0,0.9) !default;
$imagePreviewToolbarPadding:1rem !default;
$imagePreviewIndicatorColor:#f8f9fa !default;
$imagePreviewIndicatorBg:rgba(0,0,0,0.5) !default;
$imagePreviewActionIconBg:transparent !default;
$imagePreviewActionIconColor:#f8f9fa !default;
$imagePreviewActionIconHoverBg:rgba(255,255,255,0.1) !default;
$imagePreviewActionIconHoverColor:#f8f9fa !default;
$imagePreviewActionIconWidth:3rem !default;
$imagePreviewActionIconHeight:3rem !default;
$imagePreviewActionIconFontSize:1.5rem !default;
$imagePreviewActionIconBorderRadius:50% !default;

:root {
    --surface-a:#{$shade000};
    --surface-b:#{$shade100};
    --surface-c:#{$shade200};
    --surface-d:#{$shade300};
    --surface-e:#{$shade000};
    --surface-f:#{$shade000};
    --text-color:#{$shade700};
    --text-color-secondary:#{$shade600};
    --primary-color:#{$primaryColor};
    --primary-color-text:#{$primaryTextColor};
    --font-family:#{$fontFamily};
    --surface-0: #ffffff;
    --surface-50: #FAFAFA;
    --surface-100: #F5F5F5;
    --surface-200: #EEEEEE;
    --surface-300: #E0E0E0;
    --surface-400: #BDBDBD;
    --surface-500: #9E9E9E;
    --surface-600: #757575;
    --surface-700: #616161;
    --surface-800: #424242;
    --surface-900: #212121;
    --gray-50: #FAFAFA;
    --gray-100: #F5F5F5;
    --gray-200: #EEEEEE;
    --gray-300: #E0E0E0;
    --gray-400: #BDBDBD;
    --gray-500: #9E9E9E;
    --gray-600: #757575;
    --gray-700: #616161;
    --gray-800: #424242;
    --gray-900: #212121;
    --content-padding:#{$panelContentPadding};
    --inline-spacing:#{$inlineSpacing};
    --border-radius:#{$borderRadius};
    --surface-ground:#f8f9fa;
    --surface-section:#ffffff;
    --surface-card:#ffffff;
    --surface-overlay:#ffffff;
    --surface-border:#dee2e6;
    --surface-hover: #e9ecef;
}

</code></pre>
</div>

                <h4>Menu Modes</h4>
				<p>Menu has 2 modes; horizontal and overlay. Layout wrapper element in template.xhtml is used to define which mode to use by adding specific classes. Default
					is static and here is the list of classes for each mode.</p>
				<ul>
					<li>Horizontal: "layout-menu-horizontal"</li>
					<li>Overlay: "layout-menu-overlay"</li>
				</ul>

				<p>For example to create a horizontal menu, the container element of the layout should be in the following form;</p>
<pre v-code><code>
&lt;div class="layout-wrapper layout-menu-horizontal"&gt;

</code></pre>

                <p>It is also possible to leave the choice to the user by keeping the preference at a component and using an expression to bind it so that user can switch between modes. Sample
                application has an example implementation of such use case. Refer to App.vue for an example.</p>

				<h4>Grid CSS</h4>
				<p>Prestige uses PrimeFlex CSS throughout the demos such as Dashboard, however any Grid library can be used with it since Prestige itself does not depend on PrimeFlex except demo pages.</p>

				<h4>Customizing Styles</h4>
				<p>It is suggested to add your customizations in the following sass files under the override folder instead of adding them to the
					scss files under sass folder to avoid maintenance issues after an update.</p>

				<ul>
					<li><b>overrides/_layout_variables</b>: Variables of the layout.</li>
					<li><b>overrides/_layout_styles</b>: Styles for the layout.</li>
					<li><b>overrides/_theme_variables</b>: Variables of the theme.</li>
					<li><b>overrides/_theme_styles</b>: Styles for the theme.</li>
				</ul>

				<h4>Migration Guide</h4>
				<p>Every change is included in <b>CHANGELOG.md</b> file at the root folder of the distribution along with the instructions to update.</p>
            </div>
        </div>
    </div>
</template>

<script>
</script>

<style scoped lang="scss">
@import '../assets/demo/styles/documentation.scss';

.docs i {
	background-color: #fcf2a7;
	font-family: monaco,Consolas,Lucida Console,monospace;
	font-weight: 700;
	font-style: normal;
	font-size: 14px;
	padding: 2px;
}

.docs li {
	line-height: 1.5;
}
</style>
