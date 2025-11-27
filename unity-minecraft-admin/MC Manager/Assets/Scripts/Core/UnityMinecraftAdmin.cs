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
    public class UnityMinecraftAdmin : MonoBehaviour
    {
        [Header("Configuration")]
        public string apiBaseURL = "http://localhost:3000/api";

        [Header("Managers")]
        public DataManager dataManager;
        public APIManager apiManager;
        public ServerPollingService pollingService;

        [Header("UI Components")]
        public UIDocument uiDocument;
        public ServerConfigurationView serverConfigView;

        [Header("3D Visualization")]
        public ThreeDServerVisualization threeDVisualization;

        [Header("Notification System")]
        public NotificationManager notificationManager;

        private VisualElement root;

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

                // Apply default styling
                root.styleSheets.Add(Resources.Load<StyleSheet>("main-style"));
            }

            // Find or create managers if not assigned
            if (dataManager == null)
            {
                dataManager = Resources.Load<DataManager>("DataManager");
                if (dataManager == null)
                {
                    // Create a default instance if not found in resources
                    dataManager = ScriptableObject.CreateInstance<DataManager>();
                }
            }

            if (apiManager == null)
            {
                apiManager = FindFirstObjectByType<APIManager>();
            }

            if (pollingService == null)
            {
                pollingService = FindFirstObjectByType<ServerPollingService>();
            }

            // Configure API manager
            if (apiManager != null)
            {
                apiManager.apiBaseURL = apiBaseURL;

                // Subscribe to API events
                apiManager.OnServerStatusReceived += OnServerStatusReceived;
                apiManager.OnError += OnAPIError;
                apiManager.OnServerConfigReceived += OnServerConfigReceived;
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

            // Configure server config view
            if (serverConfigView != null)
            {
                serverConfigView.dataManager = dataManager;
                serverConfigView.apiManager = apiManager;
                serverConfigView.uiDocument = uiDocument;
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

        private void HandleStateChange(ApplicationState newState)
        {
            if (root == null) return;

            // Clear previous content
            root.Clear();

            // Add basic UI structure
            var mainContainer = new VisualElement();
            mainContainer.AddToClassList("root");

            // Add content container
            var contentContainer = new VisualElement();
            contentContainer.AddToClassList("content-container");

            // Add title
            var titleLabel = new Label("Minecraft Server Admin");
            titleLabel.AddToClassList("title");

            mainContainer.Add(titleLabel);
            mainContainer.Add(contentContainer);

            root.Add(mainContainer);

            // Based on state, load the appropriate view
            switch (newState)
            {
                case ApplicationState.Login:
                    CreateLoginView(contentContainer);
                    break;
                case ApplicationState.Dashboard:
                    CreateDashboardView(contentContainer);
                    // Also show 3D visualization
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(true);
                    }
                    else
                    {
                        var vizMessage = new Label("3D Visualization not available in this view mode");
                        contentContainer.Add(vizMessage);
                    }
                    break;
                case ApplicationState.ServerList:
                    CreateServerListView(contentContainer);
                    // Hide 3D visualization in other views
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
                case ApplicationState.Datapacks:
                    CreateDatapacksView(contentContainer);
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
                case ApplicationState.ServerConfiguration:
                    CreateServerConfigurationView(contentContainer);
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
                case ApplicationState.BackupManagement:
                    CreateBackupView(contentContainer);
                    if (threeDVisualization != null)
                    {
                        threeDVisualization.gameObject.SetActive(false);
                    }
                    break;
            }
        }

        private void CreateLoginView(VisualElement container)
        {
            var loginContainer = new VisualElement();
            loginContainer.style.flexDirection = FlexDirection.Column;
            loginContainer.style.alignItems = Align.Center;
            loginContainer.style.justifyContent = Justify.Center;
            loginContainer.style.height = new Length(100, LengthUnit.Percent);

            var titleLabel = new Label("Minecraft Admin Panel");
            titleLabel.AddToClassList("title");

            var usernameField = new TextField("Username");
            usernameField.value = "admin";
            usernameField.AddToClassList("input-field");

            var passwordField = new TextField("Password");
            passwordField.value = "admin123";
            passwordField.isPasswordField = true;
            passwordField.AddToClassList("input-field");

            var loginButton = new Button(() => {
                AttemptLogin(usernameField.value, passwordField.value);
            });
            loginButton.text = "Login";
            loginButton.AddToClassList("btn");
            loginButton.AddToClassList("btn-primary");

            var errorLabel = new Label();
            errorLabel.style.color = Color.red;
            errorLabel.style.display = DisplayStyle.None;

            loginContainer.Add(titleLabel);
            loginContainer.Add(usernameField);
            loginContainer.Add(passwordField);
            loginContainer.Add(loginButton);
            loginContainer.Add(errorLabel);

            container.Add(loginContainer);
        }

        private void CreateDashboardView(VisualElement container)
        {
            var dashboardContainer = new VisualElement();
            dashboardContainer.style.flexDirection = FlexDirection.Column;

            // Header
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.alignItems = Align.Center;
            headerContainer.style.marginBottom = 20;

            var titleLabel = new Label("Server Performance Dashboard");
            titleLabel.AddToClassList("title");

            var refreshButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.GetServerStatus();
                }
            });
            refreshButton.text = "Refresh";
            refreshButton.AddToClassList("btn");
            refreshButton.AddToClassList("btn-primary");

            headerContainer.Add(titleLabel);
            headerContainer.Add(refreshButton);

            dashboardContainer.Add(headerContainer);

            // Summary cards
            var summaryCardsContainer = new VisualElement();
            summaryCardsContainer.style.flexDirection = FlexDirection.Row;
            summaryCardsContainer.style.flexWrap = Wrap.Wrap;
            summaryCardsContainer.style.marginBottom = 20;

            // If we have data, create summary cards
            if (dataManager != null)
            {
                // Running servers card
                var runningServersCard = CreateSummaryCard(
                    "Running Servers",
                    dataManager.runningServersCount.ToString(),
                    new Color(0.2f, 0.4f, 0.8f, 1),
                    summaryCardsContainer
                );

                // Avg CPU Load card
                var cpuCard = CreateSummaryCard(
                    "Avg CPU Load",
                    $"{dataManager.overallCPULoad:F2}%",
                    new Color(0.2f, 0.7f, 0.2f, 1),
                    summaryCardsContainer
                );

                // Avg Memory card
                var memoryCard = CreateSummaryCard(
                    "Avg Memory",
                    "Calculating...",
                    new Color(0.8f, 0.6f, 0.2f, 1),
                    summaryCardsContainer
                );

                // Total Players card
                var playersCard = CreateSummaryCard(
                    "Total Players",
                    dataManager.totalPlayers.ToString(),
                    new Color(0.9f, 0.4f, 0.6f, 1),
                    summaryCardsContainer
                );

                // Total Allocated RAM
                var totalRAM = dataManager.GetTotalAllocatedRAM();
                var allocatedRAMCard = CreateSummaryCard(
                    "Total Allocated RAM",
                    $"{totalRAM:F2} MB",
                    new Color(0.6f, 0.4f, 0.8f, 1),
                    summaryCardsContainer
                );

                // RAM Utilization
                var ramUtilization = dataManager.GetTotalRAMUtilization();
                var ramUtilizationCard = CreateSummaryCard(
                    "RAM Utilization",
                    $"{ramUtilization:F2}%",
                    new Color(0.4f, 0.8f, 0.6f, 1),
                    summaryCardsContainer
                );
            }

            dashboardContainer.Add(summaryCardsContainer);

            // Server status table placeholder
            var tableContainer = new VisualElement();
            tableContainer.style.marginTop = 20;

            var tableTitle = new Label("Server Status");
            tableTitle.AddToClassList("subtitle");

            // Create table header
            var headerRow = new VisualElement();
            headerRow.style.flexDirection = FlexDirection.Row;
            headerRow.style.backgroundColor = new Color(0.2f, 0.2f, 0.2f, 1);
            headerRow.style.SetPadding(8);

            AddTableHeader(headerRow, "Server", 2);
            AddTableHeader(headerRow, "Status", 1);
            AddTableHeader(headerRow, "CPU", 1);
            AddTableHeader(headerRow, "Memory", 1);
            AddTableHeader(headerRow, "RAM Allocation", 1.5f);
            AddTableHeader(headerRow, "Players", 1);

            tableContainer.Add(tableTitle);
            tableContainer.Add(headerRow);

            // Add server rows if data is available
            if (dataManager != null)
            {
                foreach (var server in dataManager.servers)
                {
                    var rowContainer = new VisualElement();
                    rowContainer.style.flexDirection = FlexDirection.Row;
                    rowContainer.style.SetPadding(8);

                    // Set row background color based on status
                    switch (server.status.ToLower())
                    {
                        case "running":
                            rowContainer.style.backgroundColor = new Color(0.1f, 0.3f, 0.1f, 0.2f); // Light green
                            break;
                        case "stopped":
                            rowContainer.style.backgroundColor = new Color(0.3f, 0.2f, 0.1f, 0.2f); // Light yellow/orange
                            break;
                        case "exited":
                            rowContainer.style.backgroundColor = new Color(0.3f, 0.1f, 0.1f, 0.2f); // Light red
                            break;
                        default:
                            rowContainer.style.backgroundColor = new Color(0.2f, 0.2f, 0.2f, 0.2f); // Light gray
                            break;
                    }

                    AddTableData(rowContainer, server.server.Replace("mc-", "").Replace("-", " "));
                    AddTableData(rowContainer, server.status);
                    AddTableData(rowContainer, server.cpu);
                    AddTableData(rowContainer, server.memory);
                    AddTableData(rowContainer, $"{server.minMemory} - {server.maxMemory}");
                    AddTableData(rowContainer, server.playerCount.ToString());

                    tableContainer.Add(rowContainer);
                }
            }

            dashboardContainer.Add(tableContainer);
            container.Add(dashboardContainer);
        }

        private VisualElement CreateSummaryCard(string title, string value, Color color, VisualElement parent)
        {
            var card = new VisualElement();
            card.AddToClassList("summary-card");

            // Assign a specific class based on the content for styling
            if (title.Contains("Running Servers")) card.AddToClassList("running-servers");
            else if (title.Contains("CPU Load")) card.AddToClassList("cpu-load");
            else if (title.Contains("Memory")) card.AddToClassList("memory-usage");
            else if (title.Contains("Players")) card.AddToClassList("total-players");
            else if (title.Contains("Allocated RAM")) card.AddToClassList("total-ram");
            else if (title.Contains("Utilization")) card.AddToClassList("ram-utilization");

            card.style.flexBasis = new Length(15, LengthUnit.Percent);
            card.style.minWidth = 180;
            card.style.height = 120;

            var valueLabel = new Label(value);
            valueLabel.style.fontSize = 20;
            valueLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            valueLabel.style.marginBottom = 5;

            var titleLabel = new Label(title);
            titleLabel.style.fontSize = 12;
            titleLabel.style.unityTextAlign = TextAnchor.MiddleCenter;

            card.Add(valueLabel);
            card.Add(titleLabel);

            parent.Add(card);

            return card;
        }

        private void AddTableHeader(VisualElement container, string text, float flexBasis)
        {
            var label = new Label(text);
            label.style.flexBasis = new Length(15 * flexBasis, LengthUnit.Percent);
            label.style.unityFontStyleAndWeight = FontStyle.Bold;
            label.style.textOverflow = TextOverflow.Ellipsis;
            container.Add(label);
        }

        private void AddTableData(VisualElement container, string text)
        {
            var label = new Label(text);
            label.style.flexBasis = new Length(15, LengthUnit.Percent);
            label.style.textOverflow = TextOverflow.Ellipsis;
            container.Add(label);
        }

        private void CreateServerListView(VisualElement container)
        {
            var listContainer = new VisualElement();
            listContainer.style.flexDirection = FlexDirection.Column;

            // Header
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.alignItems = Align.Center;
            headerContainer.style.marginBottom = 20;

            var titleLabel = new Label("Minecraft Servers");
            titleLabel.AddToClassList("title");

            var refreshButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.GetServerStatus();
                }
            });
            refreshButton.text = "Refresh";
            refreshButton.AddToClassList("btn");
            refreshButton.AddToClassList("btn-primary");

            headerContainer.Add(titleLabel);
            headerContainer.Add(refreshButton);

            listContainer.Add(headerContainer);

            // Server cards container
            var cardsContainer = new VisualElement();
            cardsContainer.AddToClassList("server-grid");

            if (dataManager != null)
            {
                foreach (var server in dataManager.servers)
                {
                    var serverCard = CreateServerCard(server);
                    cardsContainer.Add(serverCard);
                }
            }

            listContainer.Add(cardsContainer);
            container.Add(listContainer);
        }

        private VisualElement CreateServerCard(ServerData server)
        {
            var card = new VisualElement();
            card.AddToClassList("server-card");
            card.AddToClassList($"status-{server.status.ToLower()}");

            // Header with server name and status
            var header = new VisualElement();
            header.style.flexDirection = FlexDirection.Row;
            header.style.justifyContent = Justify.SpaceBetween;
            header.style.marginBottom = 10;

            var nameLabel = new Label(GetServerDisplayName(server.server));
            nameLabel.style.fontSize = 16;
            nameLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var statusBadge = new VisualElement();
            statusBadge.style.backgroundColor = GetStatusColor(server.status);
            statusBadge.style.SetBorderRadius(10);
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
            statsContainer.style.marginBottom = 10;

            var cpuStat = new Label($"CPU: {server.cpu}");
            var memoryStat = new Label($"Memory: {server.memory}");
            var ramStat = new Label($"RAM: {server.minMemory} - {server.maxMemory}");
            var playersStat = new Label($"Players: {server.playerCount}");

            statsContainer.Add(cpuStat);
            statsContainer.Add(memoryStat);
            statsContainer.Add(ramStat);
            statsContainer.Add(playersStat);

            card.Add(statsContainer);

            // Control buttons
            var buttonContainer = new VisualElement();
            buttonContainer.style.flexDirection = FlexDirection.Row;
            buttonContainer.style.marginBottom = 10;

            var startButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.StartServer(server.server);
                }
            });
            startButton.text = "Start";
            startButton.AddToClassList("btn");
            startButton.AddToClassList("btn-success");
            startButton.SetEnabled(server.status != "running");

            var stopButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.StopServer(server.server);
                }
            });
            stopButton.text = "Stop";
            stopButton.AddToClassList("btn");
            stopButton.AddToClassList("btn-warning");
            stopButton.SetEnabled(server.status == "running");

            var restartButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.RestartServer(server.server);
                }
            });
            restartButton.text = "Restart";
            restartButton.AddToClassList("btn");
            restartButton.AddToClassList("btn-primary");

            buttonContainer.Add(startButton);
            buttonContainer.Add(stopButton);
            buttonContainer.Add(restartButton);

            card.Add(buttonContainer);

            // Configuration button
            var configButton = new Button(() => {
                StateManager.Instance.GoToServerConfiguration(server.server);
            });
            configButton.text = "Configure Server";
            configButton.AddToClassList("btn");
            configButton.AddToClassList("btn-primary");

            card.Add(configButton);

            return card;
        }

        private void CreateDatapacksView(VisualElement container)
        {
            var datapacksContainer = new VisualElement();
            datapacksContainer.style.flexDirection = FlexDirection.Column;

            var titleLabel = new Label("Datapacks Management");
            titleLabel.AddToClassList("title");

            var messageLabel = new Label("Datapacks management interface would be displayed here.");
            messageLabel.style.marginTop = 20;
            messageLabel.style.SetTextAlign(TextAnchor.MiddleCenter);

            datapacksContainer.Add(titleLabel);
            datapacksContainer.Add(messageLabel);

            container.Add(datapacksContainer);
        }

        private void CreateServerConfigurationView(VisualElement container)
        {
            if (serverConfigView != null && StateManager.Instance != null)
            {
                string serverName = StateManager.Instance.GetCurrentServerForConfig();
                if (!string.IsNullOrEmpty(serverName))
                {
                    serverConfigView.InitializeConfigurationView(serverName);
                }
                else
                {
                    // Fallback if no server was specified
                    var messageContainer = new VisualElement();
                    messageContainer.style.flexDirection = FlexDirection.Column;
                    messageContainer.style.alignItems = Align.Center;
                    messageContainer.style.justifyContent = Justify.Center;
                    messageContainer.style.height = new Length(100, LengthUnit.Percent);

                    var messageLabel = new Label("No server selected for configuration.");
                    messageLabel.style.marginBottom = 20;

                    var backButton = new Button(() => {
                        StateManager.Instance.ChangeState(ApplicationState.ServerList);
                    });
                    backButton.text = "Back to Server List";
                    backButton.AddToClassList("btn");
                    backButton.AddToClassList("btn-primary");

                    messageContainer.Add(messageLabel);
                    messageContainer.Add(backButton);

                    container.Add(messageContainer);
                }
            }
        }

        private void CreateBackupView(VisualElement container)
        {
            var backupContainer = new VisualElement();
            backupContainer.style.flexDirection = FlexDirection.Column;

            var titleLabel = new Label("Backup Management");
            titleLabel.AddToClassList("title");

            var messageLabel = new Label("Backup management interface would be displayed here.");
            messageLabel.style.marginTop = 20;
            messageLabel.style.SetTextAlign(TextAnchor.MiddleCenter);

            backupContainer.Add(titleLabel);
            backupContainer.Add(messageLabel);

            container.Add(backupContainer);
        }

        private Color GetStatusColor(string status)
        {
            switch (status.ToLower())
            {
                case "running": return new Color(0.2f, 0.7f, 0.2f, 1); // Green
                case "stopped": return new Color(0.9f, 0.6f, 0.2f, 1); // Yellow/Orange
                case "exited": return new Color(0.8f, 0.2f, 0.2f, 1);  // Red
                case "paused": return new Color(0.2f, 0.4f, 0.9f, 1);  // Blue
                default: return Color.gray; // Gray for unknown status
            }
        }

        private string GetServerDisplayName(string serverName)
        {
            // Map server names to display names similar to the Vue.js version
            switch (serverName)
            {
                case "mc-ilias": return "Ikaria Games";
                case "mc-niilo": return "KDLK.net";
                case "mc-bgstpoelten": return "BG St. Pölten Server";
                case "mc-htlstp": return "HTL St. Pölten Server";
                case "mc-borgstpoelten": return "BORG St. Pölten Server";
                case "mc-hakstpoelten": return "HAK St. Pölten Server";
                case "mc-basop-bafep-stp": return "BASOP BAFEP St. Pölten Server";
                case "mc-play": return "Play Server";
                default: return serverName;
            }
        }

        private void AttemptLogin(string username, string password)
        {
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.Authenticate(username, password);
            }
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
            }
        }

        private void OnServerConfigReceived(string serverName, ServerConfig config)
        {
            // Update the server configuration in the data manager
            var server = dataManager.GetServerById(serverName);
            if (server != null)
            {
                // Update only the relevant properties
                server.minMemory = config.minMemory;
                server.maxMemory = config.maxMemory;
                // Update other properties as needed
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
                apiManager.OnServerConfigReceived -= OnServerConfigReceived;
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