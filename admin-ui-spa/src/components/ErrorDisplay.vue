<template>
  <div v-if="error" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
    <div>
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Error:</strong> {{ errorMessage }}
    </div>
    <button v-if="showDismiss" type="button" class="btn-close" @click="dismissError" aria-label="Close"></button>
  </div>
</template>

<script>
export default {
  name: 'ErrorDisplay',
  props: {
    error: {
      type: [Boolean, Error, String],
      default: false
    },
    showDismiss: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    errorMessage() {
      if (typeof this.error === 'string') {
        return this.error;
      } else if (this.error instanceof Error) {
        return this.error.message;
      } else if (this.error && this.error.message) {
        return this.error.message;
      }
      return 'An unknown error occurred';
    }
  },
  methods: {
    dismissError() {
      this.$emit('dismiss');
    }
  }
}
</script>