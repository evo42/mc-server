using System.Collections;
using UnityEngine;
using MinecraftAdmin.API;
using MinecraftAdmin.Data;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.Managers
{
    public class ServerPollingService : MonoBehaviour
    {
        [Header("Polling Configuration")]
        public float pollingInterval = 30f; // Interval in seconds
        public bool autoStartPolling = true;
        
        [Header("Dependencies")]
        public APIManager apiManager;
        public DataManager dataManager;
        
        private Coroutine pollingCoroutine;
        private bool isPolling = false;
        
        private void Start()
        {
            if (autoStartPolling)
            {
                StartPolling();
            }
            
            // Subscribe to authentication changes
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess += OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnLogout += OnLogout;
            }
        }
        
        private void OnDestroy()
        {
            if (isPolling)
            {
                StopPolling();
            }
            
            // Unsubscribe from authentication events
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess -= OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnLogout -= OnLogout;
            }
        }
        
        public void StartPolling()
        {
            if (isPolling) return; // Already polling
            
            if (apiManager == null || dataManager == null)
            {
                Debug.LogError("APIManager or DataManager not assigned to ServerPollingService");
                return;
            }
            
            isPolling = true;
            pollingCoroutine = StartCoroutine(PollingRoutine());
        }
        
        public void StopPolling()
        {
            if (pollingCoroutine != null)
            {
                StopCoroutine(pollingCoroutine);
                pollingCoroutine = null;
            }
            isPolling = false;
        }
        
        private IEnumerator PollingRoutine()
        {
            while (true) // This will run until StopPolling is called
            {
                // Only poll if authenticated
                if (AuthenticationManager.Instance != null && AuthenticationManager.Instance.IsAuthenticated)
                {
                    // Request server status
                    apiManager.GetServerStatus();
                }
                
                // Wait for the polling interval
                yield return new WaitForSeconds(pollingInterval);
            }
        }
        
        private void OnAuthenticationSuccess()
        {
            // Start polling when authentication is successful
            StartPolling();
        }
        
        private void OnLogout()
        {
            // Stop polling when logged out
            StopPolling();
        }

        /// <summary>
        /// Called by external components when authentication state changes
        /// </summary>
        /// <param name="isAuthenticated">True if authenticated, false if logged out</param>
        public void OnAuthenticationChanged(bool isAuthenticated)
        {
            if (isAuthenticated)
            {
                StartPolling();
            }
            else
            {
                StopPolling();
            }
        }
    }
}