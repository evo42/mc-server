import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    darkMode: false,
    locale: 'en-US',
    theme: 'default',
    preferences: {
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      defaultView: 'dashboard',
      notifications: {
        enabled: true,
        toastPosition: 'bottom-right'
      }
    }
  }),
  
  getters: {
    isDarkMode: (state) => state.darkMode,
    currentLocale: (state) => state.locale,
    currentTheme: (state) => state.theme
  },
  
  actions: {
    // Toggle dark mode
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
      
      // Apply theme to document
      if (this.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    },
    
    // Set locale
    setLocale(locale) {
      this.locale = locale;
    },
    
    // Update preferences
    updatePreferences(newPreferences) {
      this.preferences = { ...this.preferences, ...newPreferences };
    },
    
    // Initialize from localStorage
    initializeFromStorage() {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        this.darkMode = savedDarkMode === 'true';
        
        // Apply theme to document
        if (this.darkMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    }
  }
});