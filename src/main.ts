import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { applySettings } from './services/session'
import './styles/game.css'

applySettings()
createApp(App).use(router).mount('#app')
