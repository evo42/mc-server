using UnityEngine;
using UnityEngine.UIElements;
using System.Collections;
using System.Collections.Generic;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Managers;
using MinecraftAdmin.UI;
using MinecraftAdmin.Visualization;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.Core
{
    public class MinecraftAdminApp : MonoBehaviour
    {
        [Header("Configuration")]
        public string apiBaseURL = "http://localhost:3000/api";
        
        [Header("Managers")]
        public DataManager dataManager;
        public APIManager apiManager;
        public ServerPollingService pollingService;
        
        [Header("UI Components")]
        public UIDocument uiDocument;
        public LoginView loginView;
        public DashboardView dashboardView;
        public ServerListView serverListView;
        
        [Header("3D Visualization")]
        public ThreeDServerVisualization threeDVisualization;
        
        [Header("Notification System")]
        public NotificationManager notificationManager;
        
        private VisualElement root;
        private VisualElement currentViewElement;
        
        private void Start()
        {
            InitializeApp();
        }
        
        private void InitializeApp()
        {
            // Initialize UI document
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }
            
            // Configure API manager
            if (apiManager != null)
            {
                apiManager.apiBaseURL = apiBaseURL;
                
                // Subscribe to API events
                apiManager.OnServerStatusReceived += OnServerStatusReceived;
                apiManager.OnError += OnAPIError;
            }
            
            // Configure polling service
            if (pollingService != null)
            {
                pollingService.apiManager = apiManager;
                pollingService.dataManager = dataManager;
            }
            
            // Configure 3D visualization
            if (threeDVisualization != null)
            {
                threeDVisualization.dataManager = dataManager;
            }
            
            // Subscribe to state changes
            if (StateManager.Instance != null)
            {
                StateManager.Instance.OnStateChanged += HandleStateChange;
            }
            
            // Subscribe to authentication events
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess += OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnLogout += OnLogout;
            }
            
            // Initially show the current state view
            if (StateManager.Instance != null)
            {
                HandleStateChange(StateManager.Instance.CurrentState);
            }
            else
            {
                HandleStateChange(ApplicationState.Login);
            }
        }
        
        private void HandleStateChange(ApplicationState newState)
        {
            // Clear current view
            if (currentViewElement != null && root != null)
            {
                currentViewElement.RemoveFromHierarchy();
            }
            
            // Create new view based on state
            switch (newState)
            {
                case ApplicationState.Login:
                    if (loginView != null)
                    {
                        loginView.uiDocument = uiDocument; // Ensure it has access to the UI document
                        loginView.InitializeLoginView();
                        currentViewElement = uiDocument.rootVisualElement;
                    }
                    break;
                    
                case ApplicationState.Dashboard:
                    if (dashboardView != null)
                    {
                        dashboardView.uiDocument = uiDocument;
                        dashboardView.dataManager = dataManager;
                        dashboardView.InitializeDashboard();
                        currentViewElement = uiDocument.rootVisualElement;
                    }
                    // Also show 3D visualization
                    if (threeDVisualization != null && threeDVisualization.gameObject.activeSelf)
                    {
                        threeDVisualization.gameObject.SetActive(true);
                    }
                    break;
                    
                case ApplicationState.ServerList:
                    if (serverListView != null)
                    {
                        serverListView.uiDocument = uiDocument;
                        serverListView.dataManager = dataManager;
                        serverListView.apiManager = apiManager;
                        serverListView.InitializeServerList();
                        currentViewElement = uiDocument.rootVisualElement;
                    }
                    // Hide 3D visualization in other views
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
                    
                case ApplicationState.Datapacks:
                case ApplicationState.ServerConfiguration:
                case ApplicationState.BackupManagement:
                    // For now, these will just show a simple message
                    CreateSimpleStateView(newState);
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
            }
        }
        
        private void CreateSimpleStateView(ApplicationState state)
        {
            if (root == null) return;
            
            var container = new VisualElement();
            container.style.flexDirection = FlexDirection.Column;
            container.style.alignItems = Align.Center;
            container.style.justifyContent = Justify.Center;
            container.style.height = new Length(100, LengthUnit.Percent);
            
            var titleLabel = new Label($"Coming Soon: {state} View");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = 20;
            
            var messageLabel = new Label("This feature will be implemented in a future update");
            messageLabel.style.fontSize = 16;
            messageLabel.style.marginBottom = 20;
            
            var backButton = new Button(() => {
                StateManager.Instance.ChangeState(ApplicationState.Dashboard);
            });
            backButton.text = "Back to Dashboard";
            
            container.Add(titleLabel);
            container.Add(messageLabel);
            container.Add(backButton);
            
            root.Add(container);
            currentViewElement = container;
        }
        
        private void OnAuthenticationSuccess()
        {
            // Load initial server status after successful login
            if (apiManager != null)
            {
                apiManager.GetServerStatus();
            }
            
            // Change state to dashboard
            StateManager.Instance.ChangeState(ApplicationState.Dashboard);
        }
        
        private void OnLogout()
        {
            StateManager.Instance.ChangeState(ApplicationState.Login);
            
            // Hide 3D visualization when logged out
            if (threeDVisualization != null)
            {
                threeDVisualization.gameObject.SetActive(false);
            }
        }
        
        private void OnServerStatusReceived(ServerData[] servers)
        {
            if (dataManager != null)
            {
                var serverList = new List<ServerData>();
                foreach (var server in servers)
                {
                    serverList.Add(server);
                }
                dataManager.UpdateServerData(serverList);

                // Log RAM utilization metrics
                var totalAllocated = dataManager.GetTotalAllocatedRAM();
                var totalUsed = dataManager.GetTotalUsedRAM();
                var utilization = dataManager.GetTotalRAMUtilization();

                Debug.Log($"RAM Utilization Metrics - Allocated: {totalAllocated:F2} MB, Used: {totalUsed:F2} MB, Utilization: {utilization:F2}%");
            }
        }
        
        private void OnAPIError(string error)
        {
            Debug.LogError($"API Error: {error}");
            
            if (notificationManager != null)
            {
                notificationManager.ShowNotification($"API Error: {error}", NotificationType.Error);
            }
        }
        
        private void OnDestroy()
        {
            // Unsubscribe from events to prevent memory leaks
            if (apiManager != null)
            {
                apiManager.OnServerStatusReceived -= OnServerStatusReceived;
                apiManager.OnError -= OnAPIError;
            }
            
            if (StateManager.Instance != null)
            {
                StateManager.Instance.OnStateChanged -= HandleStateChange;
            }
            
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess -= OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnLogout -= OnLogout;
            }
        }
    }
}