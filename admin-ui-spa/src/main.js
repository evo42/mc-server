import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ServerList from './components/ServerList.vue'
import ServerAdmin from './components/ServerAdmin.vue'
import Datapacks from './components/Datapacks.vue'
import './assets/css/style.css'

// Define routes
const routes = [
  { path: '/', component: ServerList },
  { path: '/server-admin', component: ServerAdmin },
  { path: '/datapacks/:server?', component: Datapacks }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')