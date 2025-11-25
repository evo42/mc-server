import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import ServerList from './components/ServerList.vue'
import ServerAdmin from './components/ServerAdmin.vue'
import Datapacks from './components/Datapacks.vue'
import ServerConfiguration from './components/ServerConfiguration.vue'
import BackupManagement from './components/BackupManagement.vue'
import Dashboard from './components/Dashboard.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/style.css'

// Define routes
const routes = [
  { path: '/', component: ServerList },
  { path: '/server-admin', component: ServerAdmin },
  { path: '/datapacks/:server?', component: Datapacks },
  { path: '/server-config/:server', component: ServerConfiguration },
  { path: '/backup/:server', component: BackupManagement },
  { path: '/dashboard', component: Dashboard }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create Pinia store instance
const pinia = createPinia()

// Create and mount app
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')