import { permixPlugin } from 'permix/vue'
import { createApp } from 'vue'
import App from './App.vue'
import { permix } from './lib/permix'
import './style.css'

createApp(App).use(permixPlugin, { permix }).mount('#app')
