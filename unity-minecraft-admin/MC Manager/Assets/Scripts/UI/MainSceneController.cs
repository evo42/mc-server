using UnityEngine;
using UnityEngine.UIElements;
using System.Collections;
using System.Collections.Generic;
using System;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Managers;
using MinecraftAdmin.Models;
using MinecraftAdmin.UI;

namespace MinecraftAdmin.UI
{
    public class MainSceneController : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager;
        public APIManager apiManager;
        public ServerPollingService pollingService;

        [Header("UI Elements")]
        public UIDocument uiDocument;
        public VisualTreeAsset dashboardTemplate;
        public VisualTreeAsset serverCardTemplate;

        private VisualElement root;
        private VisualElement currentView;

        private void OnEnable()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }

            // Subscribe to state changes
            StateManager.Instance.OnStateChanged += HandleStateChange;

            // Subscribe to authentication events
            AuthenticationManager.Instance.OnAuthenticationSuccess += OnAuthenticationSuccess;
            AuthenticationManager.Instance.OnLogout += OnLogout;
            AuthenticationManager.Instance.OnAuthenticationSuccess += OnAuthSuccessForPolling;
            AuthenticationManager.Instance.OnLogout += OnAuthLogoutForPolling;

            // Subscribe to data updates
            dataManager.OnDataUpdated += OnDataUpdated;
            dataManager.OnError += OnDataError;

            // Subscribe to API events
            apiManager.OnServerStatusReceived += OnServerStatusReceived;
            apiManager.OnError += OnAPIError;

            // Initially show login screen if not authenticated
            if (AuthenticationManager.Instance.IsAuthenticated)
            {
                StateManager.Instance.ChangeState(ApplicationState.Dashboard);
            }
            else
            {
                StateManager.Instance.ChangeState(ApplicationState.Login);
            }
        }

        private void OnAuthSuccessForPolling()
        {
            if (pollingService != null)
            {
                pollingService.OnAuthenticationChanged(true);
            }
        }

        private void OnAuthLogoutForPolling()
        {
            if (pollingService != null)
            {
                pollingService.OnAuthenticationChanged(false);
            }
        }

        private void OnDisable()
        {
            // Unsubscribe from events to prevent memory leaks
            if (StateManager.Instance != null)
                StateManager.Instance.OnStateChanged -= HandleStateChange;

            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess -= OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnLogout -= OnLogout;
                AuthenticationManager.Instance.OnAuthenticationSuccess -= OnAuthSuccessForPolling;
                AuthenticationManager.Instance.OnLogout -= OnAuthLogoutForPolling;
            }

            if (dataManager != null)
            {
                dataManager.OnDataUpdated -= OnDataUpdated;
                dataManager.OnError -= OnDataError;
            }

            if (apiManager != null)
            {
                apiManager.OnServerStatusReceived -= OnServerStatusReceived;
                apiManager.OnError -= OnAPIError;
            }
        }

        private void HandleStateChange(ApplicationState newState)
        {
            // Clear current view
            if (currentView != null)
            {
                currentView.RemoveFromHierarchy();
                currentView = null;
            }

            // Create new view based on state
            switch (newState)
            {
                case ApplicationState.Login:
                    CreateLoginView();
                    break;
                case ApplicationState.Dashboard:
                    CreateDashboardView();
                    break;
                case ApplicationState.ServerList:
                    CreateServerListView();
                    break;
                case ApplicationState.Datapacks:
                    CreateDatapacksView();
                    break;
                case ApplicationState.ServerConfiguration:
                    CreateServerConfigurationView();
                    break;
                case ApplicationState.BackupManagement:
                    CreateBackupManagementView();
                    break;
            }
        }

        private void CreateLoginView()
        {
            // This would create the login UI
            var loginContainer = new VisualElement();
            loginContainer.style.flexDirection = FlexDirection.Column;
            loginContainer.style.alignItems = Align.Center;
            loginContainer.style.justifyContent = Justify.Center;
            loginContainer.style.height = new Length(100, LengthUnit.Percent);

            var titleLabel = new Label("Minecraft Admin Panel");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            var usernameField = new TextField("Username");
            usernameField.value = "admin";

            var passwordField = new TextField("Password");
            passwordField.value = "admin123";
            passwordField.isPasswordField = true;

            var loginButton = new Button(() => {
                // Attempt to authenticate
                AuthenticationManager.Instance.Authenticate(usernameField.value, passwordField.value);
            });
            loginButton.text = "Login";

            var errorLabel = new Label();
            errorLabel.style.color = Color.red;
            errorLabel.style.display = DisplayStyle.None;

            loginContainer.Add(titleLabel);
            loginContainer.Add(usernameField);
            loginContainer.Add(passwordField);
            loginContainer.Add(loginButton);
            loginContainer.Add(errorLabel);

            root.Add(loginContainer);
            currentView = loginContainer;
        }

        private void CreateDashboardView()
        {
            // If we're in dashboard state and authenticated, try to get server status
            if (AuthenticationManager.Instance.IsAuthenticated)
            {
                apiManager.GetServerStatus();
            }

            var dashboardContainer = new VisualElement();
            dashboardContainer.style.flexDirection = FlexDirection.Column;

            // Create navigation bar
            CreateNavigationBar(dashboardContainer);

            // Create dashboard content
            var contentContainer = new VisualElement();
            contentContainer.style.flexGrow = 1;

            // Summary cards
            var summaryCardsContainer = new VisualElement();
            summaryCardsContainer.style.flexDirection = FlexDirection.Row;
            summaryCardsContainer.style.flexWrap = Wrap.Wrap;
            summaryCardsContainer.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            // Running servers card
            var runningServersCard = CreateSummaryCard("Running Servers", dataManager.runningServersCount.ToString(), "bi bi-server", Color.green);
            summaryCardsContainer.Add(runningServersCard);

            // Avg CPU Load card
            var cpuCard = CreateSummaryCard("Avg CPU Load", $"{dataManager.overallCPULoad:F2}%", "bi bi-cpu", Color.blue);
            summaryCardsContainer.Add(cpuCard);

            // Avg Memory card
            var memoryCard = CreateSummaryCard("Avg Memory", "N/A", "bi bi-memory", Color.cyan);
            summaryCardsContainer.Add(memoryCard);

            // Total Players card
            var playersCard = CreateSummaryCard("Total Players", dataManager.totalPlayers.ToString(), "bi bi-people", Color.yellow);
            summaryCardsContainer.Add(playersCard);

            contentContainer.Add(summaryCardsContainer);

            // Charts area
            var chartsContainer = new VisualElement();
            chartsContainer.style.flexDirection = FlexDirection.Row;
            chartsContainer.style.flexWrap = Wrap.Wrap;

            // This would be where we create charts, but for now we'll add placeholders
            var cpuChartCard = CreateChartCard("CPU Usage by Server", "bi bi-cpu");
            chartsContainer.Add(cpuChartCard);

            var memoryChartCard = CreateChartCard("Memory Usage by Server", "bi bi-memory");
            chartsContainer.Add(memoryChartCard);

            var statusChartCard = CreateChartCard("Server Status Distribution", "bi bi-pie-chart");
            chartsContainer.Add(statusChartCard);

            var playersChartCard = CreateChartCard("Players by Server", "bi bi-people");
            chartsContainer.Add(playersChartCard);

            contentContainer.Add(chartsContainer);

            dashboardContainer.Add(contentContainer);
            root.Add(dashboardContainer);
            currentView = dashboardContainer;
        }

        private void CreateServerListView()
        {
            var serverListContainer = new VisualElement();
            serverListContainer.style.flexDirection = FlexDirection.Column;

            // Create navigation bar
            CreateNavigationBar(serverListContainer);

            // Create server list content
            var contentContainer = new VisualElement();
            contentContainer.style.flexGrow = 1;

            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.alignItems = Align.Center;
            headerContainer.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));

            var titleLabel = new Label("Minecraft Servers");
            titleLabel.style.fontSize = 20;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var refreshButton = new Button(() => {
                apiManager.GetServerStatus();
            });
            refreshButton.text = "Refresh";

            headerContainer.Add(titleLabel);
            headerContainer.Add(refreshButton);

            contentContainer.Add(headerContainer);

            // Server cards container
            var serverCardsContainer = new VisualElement();
            serverCardsContainer.style.flexDirection = FlexDirection.Row;
            serverCardsContainer.style.flexWrap = Wrap.Wrap;

            // Add server cards for each server in the data
            foreach (var server in dataManager.servers)
            {
                var serverCard = CreateServerCard(server);
                serverCardsContainer.Add(serverCard);
            }

            contentContainer.Add(serverCardsContainer);
            serverListContainer.Add(contentContainer);

            root.Add(serverListContainer);
            currentView = serverListContainer;
        }

        private void CreateDatapacksView()
        {
            // Create datapacks view
            var datapacksContainer = new VisualElement();
            datapacksContainer.style.flexDirection = FlexDirection.Column;

            // Create navigation bar
            CreateNavigationBar(datapacksContainer);

            var titleLabel = new Label("Datapacks Management");
            titleLabel.style.fontSize = 20;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));

            datapacksContainer.Add(titleLabel);

            root.Add(datapacksContainer);
            currentView = datapacksContainer;
        }

        private void CreateServerConfigurationView()
        {
            // Create server configuration view - this will be handled by the dedicated ServerConfigurationView component
            var configContainer = new VisualElement();
            configContainer.style.flexDirection = FlexDirection.Column;

            // Create navigation bar
            CreateNavigationBar(configContainer);

            // For now, show a placeholder while we integrate the actual ServerConfigurationView
            var titleLabel = new Label("Server Configuration");
            titleLabel.style.fontSize = 20;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));

            // This would be replaced by the actual ServerConfigurationView in a complete implementation
            var contentContainer = new VisualElement();
            contentContainer.style.paddingTop = new StyleLength(new Length(20, LengthUnit.Pixel));
            contentContainer.style.paddingBottom = new StyleLength(new Length(20, LengthUnit.Pixel));
            contentContainer.style.paddingLeft = new StyleLength(new Length(20, LengthUnit.Pixel));
            contentContainer.style.paddingRight = new StyleLength(new Length(20, LengthUnit.Pixel));

            var messageLabel = new Label("Server Configuration Interface (Implementation Placeholder)");
            messageLabel.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            var placeholderButton = new Button(() => {
                // In a full implementation, this would trigger the actual config view
                if (dataManager.servers.Count > 0)
                {
                    // For demonstration, use the first server
                    string serverName = dataManager.servers[0].server;
                    StateManager.Instance.GoToServerConfiguration(serverName);
                }
            });
            placeholderButton.text = "Load Server Configuration";

            contentContainer.Add(messageLabel);
            contentContainer.Add(placeholderButton);

            configContainer.Add(titleLabel);
            configContainer.Add(contentContainer);

            root.Add(configContainer);
            currentView = configContainer;
        }

        private void CreateBackupManagementView()
        {
            // Create backup management view
            var backupContainer = new VisualElement();
            backupContainer.style.flexDirection = FlexDirection.Column;

            // Create navigation bar
            CreateNavigationBar(backupContainer);

            var titleLabel = new Label("Backup Management");
            titleLabel.style.fontSize = 20;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));

            backupContainer.Add(titleLabel);

            root.Add(backupContainer);
            currentView = backupContainer;
        }

        private void CreateNavigationBar(VisualElement parent)
        {
            var navContainer = new VisualElement();
            navContainer.style.flexDirection = FlexDirection.Row;
            navContainer.style.backgroundColor = new Color(0.1f, 0.1f, 0.1f, 1);
            navContainer.style.paddingLeft = 10;
            navContainer.style.paddingRight = 10;
            navContainer.style.paddingTop = 5;
            navContainer.style.paddingBottom = 5;
            navContainer.style.alignItems = Align.Center;

            var brandLabel = new Label("Minecraft Admin Panel");
            brandLabel.style.fontSize = 16;
            brandLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            brandLabel.style.marginRight = 20;

            // Navigation buttons
            var serversButton = new Button(() => StateManager.Instance.ChangeState(ApplicationState.ServerList));
            serversButton.text = "Servers";

            var dashboardButton = new Button(() => StateManager.Instance.ChangeState(ApplicationState.Dashboard));
            dashboardButton.text = "Dashboard";

            var datapacksButton = new Button(() => StateManager.Instance.ChangeState(ApplicationState.Datapacks));
            datapacksButton.text = "Datapacks";

            navContainer.Add(brandLabel);
            navContainer.Add(serversButton);
            navContainer.Add(dashboardButton);
            navContainer.Add(datapacksButton);

            // Spacer to push logout button to the right
            var spacer = new VisualElement();
            spacer.style.flexGrow = 1;
            navContainer.Add(spacer);

            // Dark mode toggle and logout button
            var darkModeToggle = new Button(() => {
                // Dark mode toggle functionality would go here
                ToggleDarkMode();
            });
            darkModeToggle.text = "🌙"; // Moon icon for dark mode

            var logoutButton = new Button(() => {
                AuthenticationManager.Instance.Logout();
            });
            logoutButton.text = "Logout";

            navContainer.Add(darkModeToggle);
            navContainer.Add(logoutButton);

            parent.Add(navContainer);
        }

        private void ToggleDarkMode()
        {
            // In a full implementation, we would toggle between light and dark styles
            // For now, just show a notification
            if (NotificationManager.Instance != null)
            {
                NotificationManager.Instance.ShowNotification("Dark mode toggled", NotificationType.Info);
            }
        }

        private VisualElement CreateSummaryCard(string title, string value, string iconClass, Color color)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            card.style.backgroundColor = color;
            card.style.color = Color.white;
            card.style.paddingTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingRight = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginTop = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginBottom = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginLeft = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginRight = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderTopLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderTopRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.flexBasis = new Length(20, LengthUnit.Percent);
            card.style.minWidth = 150;

            var iconLabel = new Label(iconClass); // In a real implementation, this would be an actual icon
            iconLabel.style.fontSize = 32;
            iconLabel.style.textAlign = TextAnchor.MiddleCenter;

            var valueLabel = new Label(value);
            valueLabel.style.fontSize = 24;
            valueLabel.style.textAlign = TextAnchor.MiddleCenter;
            valueLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var titleLabel = new Label(title);
            titleLabel.style.textAlign = TextAnchor.MiddleCenter;

            card.Add(iconLabel);
            card.Add(valueLabel);
            card.Add(titleLabel);

            return card;
        }

        private VisualElement CreateChartCard(string title, string iconClass)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            // Use extension method for border
            card.style.SetBorder(new StyleBorder(1));
            card.style.borderTopColor = Color.gray;
            card.style.borderRightColor = Color.gray;
            card.style.borderBottomColor = Color.gray;
            card.style.borderLeftColor = Color.gray;
            card.style.borderTopWidth = 1;
            card.style.borderRightWidth = 1;
            card.style.borderBottomWidth = 1;
            card.style.borderLeftWidth = 1;
            card.style.borderTopLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderTopRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginRight = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.flexBasis = new Length(45, LengthUnit.Percent);
            card.style.minWidth = 300;
            card.style.height = 200;

            var header = new VisualElement();
            header.style.flexDirection = FlexDirection.Row;
            header.style.alignItems = Align.Center;
            header.style.paddingTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            header.style.paddingBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            header.style.paddingLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            header.style.paddingRight = new StyleLength(new Length(10, LengthUnit.Pixel));

            var iconLabel = new Label(iconClass); // In a real implementation, this would be an actual icon
            var titleLabel = new Label(title);
            titleLabel.style.marginLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            titleLabel.style.fontSize = 16;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            header.Add(iconLabel);
            header.Add(titleLabel);

            card.Add(header);

            // Placeholder for actual chart
            var chartPlaceholder = new VisualElement();
            chartPlaceholder.style.backgroundColor = Color.gray;
            chartPlaceholder.style.flexGrow = 1;
            chartPlaceholder.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartPlaceholder.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartPlaceholder.style.marginLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartPlaceholder.style.marginRight = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartPlaceholder.style.borderTopLeftRadius = 5;
            chartPlaceholder.style.borderTopRightRadius = 5;
            chartPlaceholder.style.borderBottomRightRadius = 5;
            chartPlaceholder.style.borderBottomLeftRadius = 5;

            card.Add(chartPlaceholder);

            return card;
        }

        private VisualElement CreateServerCard(ServerData server)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            // Use extension method for border
            card.style.SetBorder(new StyleBorder(new BorderEdge(1, GetStatusColor(server.status))));
            card.style.borderTopWidth = 3;
            card.style.borderRightWidth = 1;
            card.style.borderBottomWidth = 1;
            card.style.borderLeftWidth = 1;
            card.style.borderTopLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderTopRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomRightRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderBottomLeftRadius = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.marginRight = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.width = 300;
            card.style.paddingTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            card.style.paddingRight = new StyleLength(new Length(10, LengthUnit.Pixel));

            // Header with server name and status
            var header = new VisualElement();
            header.style.flexDirection = FlexDirection.Row;
            header.style.justifyContent = Justify.SpaceBetween;

            var nameLabel = new Label(server.server.Replace("mc-", "").Replace("-", " "));
            nameLabel.style.fontSize = 16;
            nameLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var statusBadge = new VisualElement();
            statusBadge.style.backgroundColor = GetStatusColor(server.status);
            statusBadge.style.borderTopLeftRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderTopRightRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderBottomLeftRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderBottomRightRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.width = 80;
            statusBadge.style.height = 20;
            statusBadge.style.justifyContent = Justify.Center;
            statusBadge.style.alignItems = Align.Center;

            var statusLabel = new Label(server.status);
            statusLabel.style.color = Color.white;
            statusLabel.style.fontSize = 12;

            statusBadge.Add(statusLabel);
            header.Add(nameLabel);
            header.Add(statusBadge);

            card.Add(header);

            // Stats section
            var statsContainer = new VisualElement();
            statsContainer.style.flexDirection = FlexDirection.Column;
            statsContainer.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));

            var cpuStat = new Label($"CPU: {server.cpu}");
            var memoryStat = new Label($"Memory: {server.memory}");
            var playersStat = new Label($"Players: {server.playerCount}");

            statsContainer.Add(cpuStat);
            statsContainer.Add(memoryStat);
            statsContainer.Add(playersStat);

            card.Add(statsContainer);

            // Control buttons
            var buttonContainer = new VisualElement();
            buttonContainer.style.flexDirection = FlexDirection.Row;
            buttonContainer.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));

            var startButton = new Button(() => apiManager.StartServer(server.server));
            startButton.text = "Start";
            startButton.SetEnabled(server.status != "running");

            var stopButton = new Button(() => apiManager.StopServer(server.server));
            stopButton.text = "Stop";
            stopButton.SetEnabled(server.status == "running");

            var restartButton = new Button(() => apiManager.RestartServer(server.server));
            restartButton.text = "Restart";

            buttonContainer.Add(startButton);
            buttonContainer.Add(stopButton);
            buttonContainer.Add(restartButton);

            card.Add(buttonContainer);

            // Additional links
            var linksContainer = new VisualElement();
            linksContainer.style.flexDirection = FlexDirection.Column;
            linksContainer.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));

            var datapacksButton = new Button(() => {
                // Navigate to datapacks for this server
            });
            datapacksButton.text = "Manage Datapacks";

            var configButton = new Button(() => {
                // Navigate to server config
            });
            configButton.text = "Configure Server";

            var backupButton = new Button(() => {
                // Navigate to backup management
            });
            backupButton.text = "Backup/Restore";

            linksContainer.Add(datapacksButton);
            linksContainer.Add(configButton);
            linksContainer.Add(backupButton);

            card.Add(linksContainer);

            return card;
        }

        private Color GetStatusColor(string status)
        {
            switch (status)
            {
                case "running": return new Color(0.2f, 0.7f, 0.2f, 1); // Green
                case "stopped": return new Color(0.9f, 0.6f, 0.2f, 1); // Yellow/Orange
                case "exited": return new Color(0.8f, 0.2f, 0.2f, 1);  // Red
                case "paused": return new Color(0.2f, 0.4f, 0.9f, 1);  // Blue
                default: return Color.gray; // Gray for unknown status
            }
        }

        private void OnAuthenticationSuccess()
        {
            // After successful authentication, go to dashboard
            StateManager.Instance.ChangeState(ApplicationState.Dashboard);
        }

        private void OnLogout()
        {
            StateManager.Instance.ChangeState(ApplicationState.Login);
        }

        private void OnDataUpdated()
        {
            // Refresh the UI when data is updated
            if (StateManager.Instance.CurrentState == ApplicationState.Dashboard)
            {
                HandleStateChange(ApplicationState.Dashboard);
            }
            else if (StateManager.Instance.CurrentState == ApplicationState.ServerList)
            {
                HandleStateChange(ApplicationState.ServerList);
            }
        }

        private void OnDataError(string error)
        {
            Debug.LogError($"Data error: {error}");
        }

        private void OnServerStatusReceived(ServerData[] servers)
        {
            // Update the data manager with the new server data
            dataManager.UpdateServerData(new List<ServerData>(servers));
        }

        private void OnAPIError(string error)
        {
            Debug.LogError($"API error: {error}");
        }
    }
}