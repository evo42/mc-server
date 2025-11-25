<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100;">
    <div 
      v-for="toast in toasts" 
      :key="toast.id"
      class="toast show mb-2"
      :class="toastClass(toast.type)"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <strong class="me-auto">{{ toast.title || toastTypeTitle(toast.type) }}</strong>
        <button 
          type="button" 
          class="btn-close" 
          @click="removeToast(toast.id)"
          aria-label="Close"
        ></button>
      </div>
      <div class="toast-body">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToastNotifications',
  data() {
    return {
      toasts: [],
      toastId: 0
    }
  },
  methods: {
    showToast(message, type = 'info', title = null, duration = 5000) {
      const id = this.toastId++;
      const toast = {
        id,
        message,
        type,
        title
      };
      
      this.toasts.push(toast);
      
      // Auto remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, duration);
      }
      
      return id;
    },
    removeToast(id) {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
    },
    toastClass(type) {
      const classes = {
        success: 'text-bg-success',
        error: 'text-bg-danger',
        warning: 'text-bg-warning',
        info: 'text-bg-info'
      };
      return classes[type] || classes.info;
    },
    toastTypeTitle(type) {
      const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
      };
      return titles[type] || 'Info';
    }
  }
}
</script>

<style scoped>
.toast-container {
  bottom: 0;
  right: 0;
  padding-bottom: 20px;
  padding-right: 20px;
}
</style>