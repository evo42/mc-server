using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.Data;
using MinecraftAdmin.Models;
using MinecraftAdmin.API;

namespace MinecraftAdmin.UI
{
    public class ServerListView : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager;
        public APIManager apiManager;

        [Header("UI Elements")]
        public UIDocument uiDocument;

        private VisualElement root;
        private List<ServerData> filteredServers = new List<ServerData>();

        [Header("Filter Settings")]
        public string serverFilter = "";
        public string statusFilter = "";

        private void OnEnable()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }

            if (dataManager != null)
            {
                dataManager.OnDataUpdated += OnDataUpdated;
                // Initialize the view with current data
                OnDataUpdated();
            }
        }

        private void OnDisable()
        {
            if (dataManager != null)
            {
                dataManager.OnDataUpdated -= OnDataUpdated;
            }
        }

        public void InitializeServerList()
        {
            if (root == null) return;

            // Clear existing content
            root.Clear();

            // Create server list layout
            var listContainer = new VisualElement();
            listContainer.style.flexDirection = FlexDirection.Column;

            // Header with title and refresh button
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            var titleLabel = new Label("Minecraft Servers");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var refreshButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.GetServerStatus();
                }
            });
            refreshButton.text = "Refresh";

            headerContainer.Add(titleLabel);
            headerContainer.Add(refreshButton);

            listContainer.Add(headerContainer);

            // Create server cards
            var cardsContainer = CreateServerCards();
            listContainer.Add(cardsContainer);

            // Filter controls
            var filterContainer = CreateFilterControls();
            listContainer.Add(filterContainer);

            root.Add(listContainer);
        }

        private VisualElement CreateServerCards()
        {
            var cardsContainer = new VisualElement();
            cardsContainer.style.flexDirection = FlexDirection.Row;
            cardsContainer.style.flexWrap = Wrap.Wrap;
            cardsContainer.style.alignItems = Align.FlexStart;

            // Apply filters to create filtered list
            ApplyFilters();

            foreach (var server in filteredServers)
            {
                var serverCard = CreateServerCard(server);
                cardsContainer.Add(serverCard);
            }

            return cardsContainer;
        }

        private VisualElement CreateServerCard(ServerData server)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            // card.style.border = new StyleBorder(new BorderEdge(1)); // Removed - not supported
            card.style.borderTopColor = GetStatusColor(server.status);
            card.style.borderRightColor = GetStatusColor(server.status);
            card.style.borderBottomColor = GetStatusColor(server.status);
            card.style.borderLeftColor = GetStatusColor(server.status);
            card.style.borderTopWidth = 3;
            card.style.borderRightWidth = 1;
            card.style.borderBottomWidth = 1;
            card.style.borderLeftWidth = 1;
            card.style.borderTopLeftRadius = 5;
            card.style.borderTopRightRadius = 5;
            card.style.borderBottomRightRadius = 5;
            card.style.borderBottomLeftRadius = 5;
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

            var nameLabel = new Label(GetServerDisplayName(server.server));
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
            var allocatedRAMStat = new Label($"Allocated RAM: {server.minMemory} - {server.maxMemory}");
            var playersStat = new Label($"Players: {server.playerCount}");

            statsContainer.Add(cpuStat);
            statsContainer.Add(memoryStat);
            statsContainer.Add(allocatedRAMStat);
            statsContainer.Add(playersStat);

            card.Add(statsContainer);

            // Control buttons
            var buttonContainer = new VisualElement();
            buttonContainer.style.flexDirection = FlexDirection.Row;
            buttonContainer.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));

            var startButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.StartServer(server.server);
                }
            });
            startButton.text = "Start";
            startButton.SetEnabled(server.status != "running");

            var stopButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.StopServer(server.server);
                }
            });
            stopButton.text = "Stop";
            stopButton.SetEnabled(server.status == "running");

            var restartButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.RestartServer(server.server);
                }
            });
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

        private VisualElement CreateFilterControls()
        {
            var filterContainer = new VisualElement();
            filterContainer.style.flexDirection = FlexDirection.Column;
            filterContainer.style.marginTop = new StyleLength(new Length(20, LengthUnit.Pixel));

            // Server filter input
            var serverFilterContainer = new VisualElement();
            serverFilterContainer.style.flexDirection = FlexDirection.Row;
            serverFilterContainer.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));

            var serverFilterLabel = new Label("Filter servers:");
            var serverFilterField = new TextField();
            serverFilterField.value = serverFilter;
            serverFilterField.RegisterCallback<ChangeEvent<string>>(evt => {
                serverFilter = evt.newValue;
                InitializeServerList(); // Re-render with new filter
            });

            serverFilterContainer.Add(serverFilterLabel);
            serverFilterContainer.Add(serverFilterField);

            // Status filter buttons
            var statusFilterContainer = new VisualElement();
            statusFilterContainer.style.flexDirection = FlexDirection.Row;

            var allStatusButton = new Button(() => {
                statusFilter = "";
                InitializeServerList();
            });
            allStatusButton.text = "All Statuses";
            allStatusButton.SetEnabled(statusFilter != "");

            var runningButton = new Button(() => {
                statusFilter = "running";
                InitializeServerList();
            });
            runningButton.text = "Running";
            runningButton.SetEnabled(statusFilter != "running");

            var stoppedButton = new Button(() => {
                statusFilter = "stopped";
                InitializeServerList();
            });
            stoppedButton.text = "Stopped";
            stoppedButton.SetEnabled(statusFilter != "stopped");

            var exitedButton = new Button(() => {
                statusFilter = "exited";
                InitializeServerList();
            });
            exitedButton.text = "Exited";
            exitedButton.SetEnabled(statusFilter != "exited");

            statusFilterContainer.Add(allStatusButton);
            statusFilterContainer.Add(runningButton);
            statusFilterContainer.Add(stoppedButton);
            statusFilterContainer.Add(exitedButton);

            filterContainer.Add(serverFilterContainer);
            filterContainer.Add(statusFilterContainer);

            return filterContainer;
        }

        private void ApplyFilters()
        {
            filteredServers.Clear();

            foreach (var server in dataManager.servers)
            {
                bool matchesServerFilter = true;
                bool matchesStatusFilter = true;

                // Apply server name filter
                if (!string.IsNullOrEmpty(serverFilter))
                {
                    matchesServerFilter = server.server.ToLower().Contains(serverFilter.ToLower()) ||
                                         GetServerDisplayName(server.server).ToLower().Contains(serverFilter.ToLower());
                }

                // Apply status filter
                if (!string.IsNullOrEmpty(statusFilter))
                {
                    matchesStatusFilter = server.status.ToLower() == statusFilter.ToLower();
                }

                if (matchesServerFilter && matchesStatusFilter)
                {
                    filteredServers.Add(server);
                }
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

        private void OnDataUpdated()
        {
            InitializeServerList();
        }
    }
}