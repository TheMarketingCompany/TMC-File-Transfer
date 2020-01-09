<template>
    <div id="layout-config">
        <a id="layout-config-button" class="layout-config-button" @click="onConfigButtonClick($event)">
            <i class="pi pi-cog"></i>
        </a>
        <div class="layout-config" :class="{ 'layout-config-active': configActive }" @click="onConfigClick">
            <h5>Menu Modes</h5>
            <div class="field-radiobutton">
                <RadioButton id="horizontal" name="layoutMode" value="horizontal" v-model="d_layoutMode" @change="changeLayoutMode($event, 'horizontal')" />
                <label for="horizontal">Horizontal</label>
            </div>
            <div class="field-radiobutton">
                <RadioButton id="overlay" name="layoutMode" value="overlay" v-model="d_layoutMode" @change="changeLayoutMode($event, 'overlay')" />
                <label for="overlay">Overlay</label>
            </div>
            <hr />

            <h5>Wrapper Modes</h5>
            <div class="field-radiobutton">
                <RadioButton id="boxed" name="wrapperMode" :value="false" :modelValue="fullWidth" @update:modelValue="changeWrapperMode" :disabled="isMobile()"/>
                <label for="boxed">Boxed</label>
            </div>
            <div class="field-radiobutton">
                <RadioButton id="filled" name="wrapperMode" :value="true" :modelValue="fullWidth" @update:modelValue="changeWrapperMode" :disabled="isMobile()"/>
                <label for="filled">Filled</label>
            </div>
            <hr />

            <h5 style="margin-top: 0">Input Style</h5>
            <div class="field-radiobutton">
				<RadioButton id="input_outlined" name="inputstyle" value="outlined" :modelValue="value" @update:modelValue="onChange"/>
				<label for="input_outlined">Outlined</label>
			</div>
			<div class="field-radiobutton">
				<RadioButton id="input_filled" name="inputstyle" value="filled" :modelValue="value" @update:modelValue="onChange"/>
				<label for="input_filled">Filled</label>
			</div>
            <hr />

            <h5 style="margin-top: .5em">Ripple Effect</h5>
			<InputSwitch :modelValue="rippleActive" @update:modelValue="onRippleChange"/>
            <hr />

            <h5>Layout Theme</h5>
            <div class="field-radiobutton">
                <RadioButton inputId="layoutColored" name="menuColor" value="color" v-model="layoutColorMode" @click="changeMenuColorMode('color')"></RadioButton>
                <label for="layoutColored">Colored</label>
            </div>
            <div class="field-radiobutton">
                <RadioButton inputId="layoutImage" name="menuColor" value="image" v-model="layoutColorMode" @click="changeMenuColorMode('image')"></RadioButton>
                <label for="layoutImage">Custom</label>
            </div>
            <div class="layout-themes">
                <div v-for="l of layoutThemes" :key="l.name">
                    <a style="cursor: pointer" @click="changeLayoutTheme($event, l.file, l.componentTheme)" :title="l.name"
                        :class="['layout-config-option', {'selected': (layout === l.file)}]" :style="{backgroundImage: 'linear-gradient(to right, ' + l.color1 +','+ l.color2+')'} ">
                        <img v-if="layoutColorMode === 'image'" :src="'layout/images/configurator/layout/' + l.image" :alt="l.name">
                        <i class="pi pi-check" v-if="layout === l.file"></i>
                    </a>
                </div>
            </div>
            <hr />

            <h5>Theme Colors</h5>
            <div class="layout-themes">
                <div  v-for="t of componentThemes" :key="t.name">
                    <a @click="changeComponentTheme($event, t.file)" :class="['layout-config-option', {'selected': (theme === t.file)}]" :style="{backgroundColor:t.color}">
                        <i class="pi pi-check" v-if="theme === t.file"></i>
                    </a>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
export default {
    emits: ['config-button-click', 'config-click', 'layout-mode-change', 'layout-change', 'theme-change'],
    props: {
        theme: String,
        layout: String,
        layoutMode: {
            type: String,
            default: null
        },
        wrapperMode: {
            type: Boolean,
            default: false
        },
        configActive: {
            type: Boolean,
            default: null,
        },
        configClick: {
            type: Boolean,
            default: null,
        },
    },
    data() {
        return {
            d_layoutMode: this.layoutMode,
            d_wrapperMode: this.wrapperMode,
            layoutThemes: null,
            layoutColorMode: 'color',
			componentThemes: [
                {name: 'Amber Accent', file: 'amber', color:'#FFC107'},
                {name: 'Blue Accent', file: 'blue', color:'#2196F3'},
                {name: 'Blue Gray Accent', file: 'bluegray', color:'#607D8B'},
                {name: 'Brown Accent', file: 'brown', color:'#795548'},
                {name: 'Cyan Accent', file: 'cyan', color:'#00BCD4'},
                {name: 'Deep Orange Accent', file: 'deeporange', color:'#FF5722'},
                {name: 'Deep Purple Accent', file: 'deeppurple', color:'#673AB7'},
                {name: 'Green Accent', file: 'green', color:'#4CAF50'},
                {name: 'Indigo Accent', file: 'indigo', color:'#3F51B5'},
                {name: 'Light Blue Accent', file: 'lightblue', color:'#03A9F4'},
                {name: 'Light Green Accent', file: 'lightgreen', color:'#8BC34A'},
                {name: 'Lime Accent', file: 'lime', color:'#CDDC39'},
                {name: 'Orange Accent', file: 'orange', color:'#FF9800'},
                {name: 'Pink Accent', file: 'pink', color:'#E91E63'},
                {name: 'Purple Accent', file: 'purple', color:'#9C27B0'},
                {name: 'Teal Accent', file: 'teal', color:'#00796B'},
                {name: 'Yellow Accent', file: 'yellow', color:'#FFEB3B'},
            ],
            layoutThemesImage: [
                {name: 'Aqua', file: 'layout-aqua', image: 'aqua.png', componentTheme: 'cyan'},
                {name: 'Arecaceae', file: 'layout-arecaceae', image: 'arecaceae.png', componentTheme: 'green'},
                {name: 'Canvas', file: 'layout-canvas', image: 'canvas.png', componentTheme: 'indigo'},
                {name: 'Cross', file: 'layout-cross', image: 'cross.png', componentTheme: 'brown'},
                {name: 'Dream', file: 'layout-dream', image: 'dream.png', componentTheme: 'teal'},
                {name: 'Emerald', file: 'layout-emerald', image: 'emerald.png', componentTheme: 'bluegray'},
                {name: 'Focus', file: 'layout-focus', image: 'focus.png', componentTheme: 'bluegray'},
                {name: 'Forest', file: 'layout-forest', image: 'forest.png', componentTheme: 'teal'},
                {name: 'Fractal', file: 'layout-fractal', image: 'fractal.png', componentTheme: 'teal'},
                {name: 'Gem', file: 'layout-gem', image: 'gem.png', componentTheme: 'amber'},
                {name: 'Grass', file: 'layout-grass', image: 'grass.png', componentTheme: 'lightgreen'},
                {name: 'Jungfraujoch', file: 'layout-jungfraujoch', image: 'jungfraujoch.png', componentTheme: 'lightblue'},
                {name: 'Mackenzie', file: 'layout-mackenzie', image: 'mackenzie.png', componentTheme: 'bluegray'},
                {name: 'Madrid', file: 'layout-madrid', image: 'madrid.png', componentTheme: 'bluegray'},
                {name: 'Marble', file: 'layout-marble', image: 'marble.png', componentTheme: 'purple'},
                {name: 'Metro', file: 'layout-metro', image: 'metro.png', componentTheme: 'bluegray'},
                {name: 'Milan', file: 'layout-milan', image: 'milan.png', componentTheme: 'bluegray'},
                {name: 'Mist', file: 'layout-mist', image: 'mist.png', componentTheme: 'cyan'},
                {name: 'Osterreich', file: 'layout-osterreich', image: 'osterreich.png', componentTheme: 'cyan'},
                {name: 'Palm', file: 'layout-palm', image: 'palm.png', componentTheme: 'bluegray'},
                {name: 'Polygon', file: 'layout-polygon', image: 'polygon.png', componentTheme: 'lightblue'},
                {name: 'Sand', file: 'layout-sand', image: 'sand.png', componentTheme: 'brown'},
                {name: 'Stone', file: 'layout-stone', image: 'stone.png', componentTheme: 'lightgreen'},
                {name: 'Wood', file: 'layout-wood', image: 'wood.png', componentTheme: 'green'}
            ],
            layoutThemesColored: [
                {name: 'Amber', file: 'layout-amber', color1: '#FFB300', color2: '#FF6F00', componentTheme: 'amber'},
                {name: 'Amethyst', file: 'layout-amethyst', color1: '#8E24AA', color2: '#5E35B1', componentTheme: 'purple'},
                {name: 'Blue', file: 'layout-blue', color1: '#1E88E5', color2: '#0D47A1', componentTheme: 'blue'},
                {name: 'Blue Grey', file: 'layout-bluegray', color1: '#546E7A', color2: '#263238', componentTheme: 'bluegray'},
                {name: 'Brown', file: 'layout-brown', color1: '#6D4C41', color2: '#3E2723', componentTheme: 'brown'},
                {name: 'Cyan', file: 'layout-cyan', color1: '#00ACC1', color2: '#006064', componentTheme: 'cyan'},
                {name: 'Deep Orange', file: 'layout-deeporange', color1: '#F4511E',
                    color2: '#BF360C', componentTheme: 'deeporange'},
                {name: 'Deep Purple', file: 'layout-deeppurple', color1: '#5E35B1',
                    color2: '#311B92', componentTheme: 'deeppurple'},
                {name: 'Fate', file: 'layout-fate', color1: '#3949AB', color2: '#D81B60', componentTheme: 'blue'},
                {name: 'Green', file: 'layout-green', color1: '#43A047', color2: '#1B5E20', componentTheme: 'green'},
                {name: 'Indigo', file: 'layout-indigo', color1: '#3949AB', color2: '#1A237E', componentTheme: 'indigo'},
                {name: 'Light Blue', file: 'layout-lightblue', color1: '#039BE5',
                    color2: '#01579B', componentTheme: 'lightblue'},
                {name: 'Light Green', file: 'layout-lightgreen', color1: '#7CB342',
                    color2: '#33691E', componentTheme: 'lightgreen'},
                {name: 'Lime', file: 'layout-lime', color1: '#C0CA33', color2: '#827717', componentTheme: 'lime'},
                {name: 'Midnight', file: 'layout-midnight', color1: '#2c3640', color2: '#15202b', componentTheme: 'blue'},
                {name: 'Orange', file: 'layout-orange', color1: '#FB8C00', color2: '#E65100', componentTheme: 'orange'},
                {name: 'Pink', file: 'layout-pink', color1: '#D81B60', color2: '#880E4F', componentTheme: 'pink'},
                {name: 'Purple', file: 'layout-purple', color1: '#8E24AA', color2: '#4A148C', componentTheme: 'purple'},
                {name: 'Rhyme', file: 'layout-rhyme', color1: '#1E88E5', color2: '#8E24AA', componentTheme: 'blue'},
                {name: 'Smoke', file: 'layout-smoke', color1: '#6c757d', color2: '#343a40', componentTheme: 'lightgreen'},
                {name: 'Soul', file: 'layout-soul', color1: '#1E88E5', color2: '#311B92', componentTheme: 'blue'},
                {name: 'Steel', file: 'layout-steel', color1: '#43464B', color2: '#212325', componentTheme: 'lightgreen'},
                {name: 'Teal', file: 'layout-teal', color1: '#00897B', color2: '#004D40', componentTheme: 'teal'},
                {name: 'Yellow', file: 'layout-yellow', color1: '#FDD835', color2: '#F57F17', componentTheme: 'yellow'}
            ]
        }
    },
    mounted() {
        this.layoutThemes = this.layoutThemesColored;
    },
    methods: {
        changeMenuColorMode(mode) {
            if (mode === 'color') {
                this.layoutThemes = this.layoutThemesColored;
            }
            else {
                this.layoutThemes = this.layoutThemesImage;
            }
        },
        onConfigClick(event) {
            this.$emit("config-click", event);
        },
        onConfigButtonClick(event) {
            this.$emit("config-button-click", event);
            event.preventDefault();
        },
        onChange(value) {
            this.$primevue.config.inputStyle = value;
        },
        onRippleChange(value) {
            this.$primevue.config.ripple = value;
        },
        changeWrapperMode(mode) {
            this.$appState.fullWidth = mode;
        },
        changeLayoutMode(event, mode) {
            this.$emit('layout-mode-change', mode);
        },
        changeLayoutTheme(event, layout, theme) {
            this.$emit('layout-change', layout);
            this.$emit('theme-change', theme);
            this.changeStyleSheetUrl('layout-css', layout, 'layout');
			this.changeStyleSheetUrl('theme-css', theme, 'theme');
            event.preventDefault();
        },
        changeComponentTheme(event, theme) {
            this.changeStyleSheetUrl('theme-css', theme, 'theme');
            this.$emit('theme-change', theme);
            event.preventDefault();
        },
		changeStyleSheetUrl(id, value) {
			let element = document.getElementById(id);
			let urlTokens = element.getAttribute('href').split('/');

			if (id.localeCompare('layout-css') === 0) {
				urlTokens[urlTokens.length - 1] = value + '.css';
			}
			else {
				urlTokens[urlTokens.length - 1] = 'theme-' + value + '.css' ;
            }

			let newURL = urlTokens.join('/');
			this.replaceLink(element, newURL);
		},
		replaceLink(linkElement, href) {
			const id = linkElement.getAttribute('id');
			const cloneLinkElement = linkElement.cloneNode(true);

			cloneLinkElement.setAttribute('href', href);
			cloneLinkElement.setAttribute('id', id + '-clone');

			linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);

			cloneLinkElement.addEventListener('load', () => {
				linkElement.remove();
				cloneLinkElement.setAttribute('id', id);
			});
		},
        isMobile() {
			return window.innerWidth <= 991;
		}
    },
    computed: {
        rippleActive() {
            return this.$primevue.config.ripple;
        },
        value() {
            return this.$primevue.config.inputStyle;
        },
        fullWidth() {
            return this.$appState.fullWidth;
        }
    }
}
</script>
