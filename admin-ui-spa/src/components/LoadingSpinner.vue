<template>
  <div v-if="loading" class="d-flex justify-content-center align-items-center" :class="containerClass">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">{{ loadingText }}</span>
    </div>
    <span v-if="loadingText" class="ms-2">{{ loadingText }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading: boolean;
  loadingText?: string;
  containerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Loading...',
  containerClass: 'my-4'
});
</script>

<style scoped>
/* CSS remains the same */
</style>