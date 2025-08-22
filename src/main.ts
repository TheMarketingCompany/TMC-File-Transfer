import { createApp } from 'vue'
import './style.css'
import './styles/material-theme.css'
import App from './App.vue'

// Import Material Web components
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@material/web/checkbox/checkbox.js'
import '@material/web/progress/linear-progress.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/icon/icon.js'

import router from './router.ts'

const app = createApp(App);

app.use(router);

app.mount('#app');
