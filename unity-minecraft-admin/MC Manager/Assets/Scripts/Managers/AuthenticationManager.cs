using System;
using UnityEngine;

namespace MinecraftAdmin.Managers
{
    public class AuthenticationManager : MonoBehaviour
    {
        [Header("Authentication Settings")]
        [SerializeField] private string username = "admin";
        [SerializeField] private string password = "admin123";
        
        public static AuthenticationManager Instance { get; private set; }
        
        public bool IsAuthenticated { get; private set; }
        public string AuthToken { get; private set; }
        
        // Events
        public Action OnAuthenticationSuccess;
        public Action OnAuthenticationFailed;
        public Action OnLogout;

        private void Awake()
        {
            // Singleton pattern
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Start()
        {
            // Try to authenticate automatically on start
            Authenticate(username, password);
        }

        public void Authenticate(string user, string pass)
        {
            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                Debug.LogError("Username or password is empty");
                OnAuthenticationFailed?.Invoke();
                return;
            }

            // Create the basic authentication token
            string credentials = System.Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{user}:{pass}"));
            AuthToken = $"Basic {credentials}";

            // For now, just set authenticated to true
            // In a real implementation, we would make a call to the API to verify credentials
            IsAuthenticated = true;
            OnAuthenticationSuccess?.Invoke();

            Debug.Log("Authentication successful");
        }

        public void Logout()
        {
            IsAuthenticated = false;
            AuthToken = null;
            OnLogout?.Invoke();
        }

        public bool ValidateCredentials(string user, string pass)
        {
            // In a real implementation, this would call the API to validate credentials
            // For now, just check against the default values
            return user == username && pass == password;
        }
    }
}