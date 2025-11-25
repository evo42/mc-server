<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <i class="bi bi-cpu"></i> Minecraft Admin Panel
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Servers</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/datapacks">Datapacks</router-link>
            </li>
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link dark-mode-toggle" href="#" @click="configStore.toggleDarkMode" title="Toggle dark mode">
                <i :class="configStore.isDarkMode ? 'bi bi-sun' : 'bi bi-moon'"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click="logout">
                <i class="bi bi-box-arrow-right"></i> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container-fluid mt-4">
      <div v-if="isLoading" class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else>
        <router-view @auth-error="handleAuthError" @show-toast="showToast"></router-view>
      </div>
    </div>

    <!-- Toast notifications -->
    <toast-notifications ref="toastNotifications" />

    <!-- Login Modal -->
    <div class="modal fade" id="loginModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Login Required</h5>
          </div>
          <div class="modal-body">
            <form @submit.prevent="attemptLogin">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input type="text" class="form-control" id="username" v-model="username" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" v-model="password" required>
              </div>
              <div v-if="loginError" class="alert alert-danger">
                {{ loginError }}
              </div>
              <button type="submit" class="btn btn-primary">Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import ToastNotifications from './components/ToastNotifications.vue'
import { useConfigStore } from './stores/configStore'

export default {
  name: 'App',
  components: {
    ToastNotifications
  },
  setup() {
    const configStore = useConfigStore();
    return { configStore };
  },
  data() {
    return {
      isLoading: true,
      username: '',
      password: '',
      loginError: null
    }
  },
  async mounted() {
    // Initialize the config store (handles dark mode)
    this.configStore.initializeFromStorage();

    // Check if we have stored credentials or need to authenticate
    this.checkAuth();
  },
  methods: {
    async checkAuth() {
      try {
        // Try to make a simple API call to test authentication
        await axios.get('/api/servers/status');
        this.isLoading = false;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Need to login - Bootstrap modal is accessed directly via DOM
          this.showLoginModal();
        } else {
          console.error('Error checking auth:', error);
          this.isLoading = false;
        }
      }
    },
    showLoginModal() {
      // Use vanilla JavaScript to show the modal since bootstrap is loaded via CDN
      const modalElement = document.getElementById('loginModal');
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    },
    async attemptLogin() {
      try {
        // Set axios defaults with base64 encoded credentials for basic auth
        const credentials = btoa(`${this.username}:${this.password}`);
        axios.defaults.headers.common['Authorization'] = `Basic ${credentials}`;

        // Test the credentials
        await axios.get('/api/servers/status');

        // Clear login form and hide modal
        this.loginError = null;
        this.username = '';
        this.password = '';

        // Hide the modal
        const modalElement = document.getElementById('loginModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        this.isLoading = false;
      } catch (error) {
        this.loginError = 'Invalid username or password';
        console.error('Login error:', error);
      }
    },
    logout() {
      // Clear the authorization header
      delete axios.defaults.headers.common['Authorization'];
      this.showLoginModal();
    },
    handleAuthError() {
      this.logout();
    },
    showToast(message, type = 'info', title = null) {
      if (this.$refs.toastNotifications) {
        this.$refs.toastNotifications.showToast(message, type, title);
      }
    }
  }
}
</script>