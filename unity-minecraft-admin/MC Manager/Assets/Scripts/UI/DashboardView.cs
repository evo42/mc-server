using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using System.Linq;
using MinecraftAdmin.Data;
using MinecraftAdmin.Models;
using MinecraftAdmin.UI;

namespace MinecraftAdmin.UI
{
    public class DashboardView : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager;

        [Header("UI Elements")]
        public UIDocument uiDocument;

        private VisualElement root;

        private void OnEnable()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }

            if (dataManager != null)
            {
                dataManager.OnDataUpdated += OnDataUpdated;
                // Initialize the dashboard with current data
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

        public void InitializeDashboard()
        {
            if (root == null) return;

            // Clear existing content
            root.Clear();

            // Create dashboard layout
            var dashboardContainer = new VisualElement();
            dashboardContainer.style.flexDirection = FlexDirection.Column;

            // Header with title and refresh button
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            var titleLabel = new Label("Server Performance Dashboard");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var refreshButton = new Button(() => {
                // Trigger refresh from API
            });
            refreshButton.text = "Refresh";

            headerContainer.Add(titleLabel);
            headerContainer.Add(refreshButton);

            dashboardContainer.Add(headerContainer);

            // Summary cards
            var summaryCardsContainer = CreateSummaryCards();
            dashboardContainer.Add(summaryCardsContainer);

            // Charts section
            var chartsContainer = CreateChartsSection();
            dashboardContainer.Add(chartsContainer);

            // Server status table
            var tableContainer = CreateServerStatusTable();
            dashboardContainer.Add(tableContainer);

            root.Add(dashboardContainer);
        }

        private VisualElement CreateSummaryCards()
        {
            var summaryContainer = new VisualElement();
            summaryContainer.style.flexDirection = FlexDirection.Row;
            summaryContainer.style.flexWrap = Wrap.Wrap;
            summaryContainer.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            // Running servers card
            var runningServersCard = CreateSummaryCard(
                "Running Servers",
                dataManager.runningServersCount.ToString(),
                "bi bi-server",
                new Color(0.1f, 0.6f, 0.8f, 1) // Blue
            );
            summaryContainer.Add(runningServersCard);

            // Avg CPU Load card
            var cpuCard = CreateSummaryCard(
                "Avg CPU Load",
                $"{dataManager.overallCPULoad:F2}%",
                "bi bi-cpu",
                new Color(0.2f, 0.7f, 0.2f, 1) // Green
            );
            summaryContainer.Add(cpuCard);

            // Avg Memory card - calculate this from our data
            var avgMemory = CalculateAverageMemory();
            var memoryCard = CreateSummaryCard(
                "Avg Memory",
                avgMemory,
                "bi bi-memory",
                new Color(0.8f, 0.6f, 0.2f, 1) // Yellow/Orange
            );
            summaryContainer.Add(memoryCard);

            // Total Players card
            var playersCard = CreateSummaryCard(
                "Total Players",
                dataManager.totalPlayers.ToString(),
                "bi bi-people",
                new Color(0.9f, 0.4f, 0.6f, 1) // Pink
            );
            summaryContainer.Add(playersCard);

            // Total Allocated RAM
            var totalRAM = dataManager.GetTotalAllocatedRAM();
            var allocatedRAMCard = CreateSummaryCard(
                "Total Allocated RAM",
                $"{totalRAM:F2} MB",
                "bi bi-memory",
                new Color(0.6f, 0.4f, 0.8f, 1) // Purple
            );
            summaryContainer.Add(allocatedRAMCard);

            // RAM Utilization
            var ramUtilization = dataManager.GetTotalRAMUtilization();
            var ramUtilizationCard = CreateSummaryCard(
                "RAM Utilization",
                $"{ramUtilization:F2}%",
                "bi bi-speedometer2",
                new Color(0.4f, 0.8f, 0.6f, 1) // Teal
            );
            summaryContainer.Add(ramUtilizationCard);

            // RAM Headroom
            float totalUsed = dataManager.GetTotalUsedRAM();
            float totalAllocated = dataManager.GetTotalAllocatedRAM();
            float headroom = totalAllocated - totalUsed;
            var ramHeadroomCard = CreateSummaryCard(
                "RAM Headroom",
                $"{headroom:F2} MB",
                "bi bi-speedometer2",
                new Color(0.8f, 0.4f, 0.6f, 1) // Rose
            );
            summaryContainer.Add(ramHeadroomCard);

            return summaryContainer;
        }

        private string CalculateAverageMemory()
        {
            // Calculate average memory usage
            if (dataManager.servers.Count == 0) return "N/A";

            float totalMemory = 0;
            int validServers = 0;

            foreach (var server in dataManager.servers)
            {
                if (server.MemoryInMB > 0) // Only count servers with valid memory data
                {
                    totalMemory += server.MemoryInMB;
                    validServers++;
                }
            }

            if (validServers == 0) return "N/A";

            float avgMemory = totalMemory / validServers;
            return $"{avgMemory:F2} MB";
        }

        private VisualElement CreateSummaryCard(string title, string value, string iconClass, Color backgroundColor)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            card.style.backgroundColor = backgroundColor;
            card.style.color = Color.white;
            card.style.paddingTop = new StyleLength(new Length(15, LengthUnit.Pixel));
            card.style.paddingBottom = new StyleLength(new Length(15, LengthUnit.Pixel));
            card.style.paddingLeft = new StyleLength(new Length(15, LengthUnit.Pixel));
            card.style.paddingRight = new StyleLength(new Length(15, LengthUnit.Pixel));
            card.style.marginTop = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginBottom = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginLeft = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.marginRight = new StyleLength(new Length(5, LengthUnit.Pixel));
            card.style.borderTopLeftRadius = new StyleLength(new Length(8, LengthUnit.Pixel));
            card.style.borderTopRightRadius = new StyleLength(new Length(8, LengthUnit.Pixel));
            card.style.borderBottomLeftRadius = new StyleLength(new Length(8, LengthUnit.Pixel));
            card.style.borderBottomRightRadius = new StyleLength(new Length(8, LengthUnit.Pixel));
            card.style.flexBasis = new Length(23, LengthUnit.Percent);
            card.style.minWidth = 180;
            card.style.height = 120;

            var iconLabel = new Label(iconClass); // In a full implementation, this would be an actual icon
            iconLabel.style.fontSize = 28;
            iconLabel.style.textAlign = TextAnchor.MiddleCenter;
            iconLabel.style.marginBottom = new StyleLength(new Length(5, LengthUnit.Pixel));

            var valueLabel = new Label(value);
            valueLabel.style.fontSize = 20;
            valueLabel.style.textAlign = TextAnchor.MiddleCenter;
            valueLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var titleLabel = new Label(title);
            titleLabel.style.textAlign = TextAnchor.MiddleCenter;
            titleLabel.style.fontSize = 12;
            titleLabel.style.marginTop = new StyleLength(new Length(5, LengthUnit.Pixel));

            card.Add(iconLabel);
            card.Add(valueLabel);
            card.Add(titleLabel);

            return card;
        }

        private VisualElement CreateChartsSection()
        {
            var chartsContainer = new VisualElement();
            chartsContainer.style.flexDirection = FlexDirection.Row;
            chartsContainer.style.flexWrap = Wrap.Wrap;
            chartsContainer.style.marginBottom = new StyleLength(new Length(20, LengthUnit.Pixel));

            // CPU Usage Chart
            var cpuChartCard = CreateChartCard(
                "CPU Usage by Server",
                "bi bi-cpu",
                CreateCPUChart()
            );
            chartsContainer.Add(cpuChartCard);

            // Memory Usage Chart
            var memoryChartCard = CreateChartCard(
                "Memory Usage by Server",
                "bi bi-memory",
                CreateMemoryChart()
            );
            chartsContainer.Add(memoryChartCard);

            // Status Distribution Chart
            var statusChartCard = CreateChartCard(
                "Server Status Distribution",
                "bi bi-pie-chart",
                CreateStatusChart()
            );
            chartsContainer.Add(statusChartCard);

            // Players Chart
            var playersChartCard = CreateChartCard(
                "Players by Server",
                "bi bi-people",
                CreatePlayersChart()
            );
            chartsContainer.Add(playersChartCard);

            return chartsContainer;
        }

        private VisualElement CreateChartCard(string title, string iconClass, VisualElement chartElement)
        {
            var card = new VisualElement();
            card.style.flexDirection = FlexDirection.Column;
            // Use extension method for border
            card.style.SetBorder(new StyleBorder(1));
            card.style.borderTopColor = new Color(0.7f, 0.7f, 0.7f, 1);
            card.style.borderRightColor = new Color(0.7f, 0.7f, 0.7f, 1);
            card.style.borderBottomColor = new Color(0.7f, 0.7f, 0.7f, 1);
            card.style.borderLeftColor = new Color(0.7f, 0.7f, 0.7f, 1);
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
            card.style.minWidth = 350;
            card.style.height = 300;

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

            // Add the chart element (this would be where the actual chart goes)
            chartElement.style.flexGrow = 1;
            chartElement.style.marginTop = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartElement.style.marginBottom = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartElement.style.marginLeft = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartElement.style.marginRight = new StyleLength(new Length(10, LengthUnit.Pixel));
            chartElement.style.borderTopLeftRadius = 5;
            chartElement.style.borderTopRightRadius = 5;
            chartElement.style.borderBottomRightRadius = 5;
            chartElement.style.borderBottomLeftRadius = 5;

            card.Add(chartElement);

            return card;
        }

        private VisualElement CreateCPUChart()
        {
            var chartContainer = new VisualElement();
            chartContainer.style.backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1);

            if (dataManager.servers.Count == 0) return chartContainer;

            // Create chart data from server data
            var chartData = ChartManager.CreateCPUChartData(dataManager.servers);

            // For demonstration, we'll create a simple bar chart visualization
            chartContainer.style.flexDirection = FlexDirection.Row;
            chartContainer.style.alignItems = Align.Center;
            chartContainer.style.justifyContent = Justify.Center;

            var label = new Label("CPU Usage Chart (Implementation Placeholder)");
            label.style.fontSize = 14;
            label.style.unityTextAlign = TextAnchor.MiddleCenter;

            chartContainer.Add(label);

            return chartContainer;
        }

        private VisualElement CreateMemoryChart()
        {
            var chartContainer = new VisualElement();
            chartContainer.style.backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1);

            if (dataManager.servers.Count == 0) return chartContainer;

            // Create chart data from server data
            var chartData = ChartManager.CreateMemoryChartData(dataManager.servers);

            // For demonstration, we'll create a simple visualization
            chartContainer.style.flexDirection = FlexDirection.Row;
            chartContainer.style.alignItems = Align.Center;
            chartContainer.style.justifyContent = Justify.Center;

            var label = new Label("Memory Usage Chart (Implementation Placeholder)");
            label.style.fontSize = 14;
            label.style.unityTextAlign = TextAnchor.MiddleCenter;

            chartContainer.Add(label);

            return chartContainer;
        }

        private VisualElement CreateStatusChart()
        {
            var chartContainer = new VisualElement();
            chartContainer.style.backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1);

            if (dataManager.servers.Count == 0) return chartContainer;

            // Create chart data from server data
            var chartData = ChartManager.CreateStatusChartData(dataManager.servers);

            // For demonstration, we'll create a simple visualization
            chartContainer.style.flexDirection = FlexDirection.Row;
            chartContainer.style.alignItems = Align.Center;
            chartContainer.style.justifyContent = Justify.Center;

            var label = new Label("Status Distribution Chart (Implementation Placeholder)");
            label.style.fontSize = 14;
            label.style.unityTextAlign = TextAnchor.MiddleCenter;

            chartContainer.Add(label);

            return chartContainer;
        }

        private VisualElement CreatePlayersChart()
        {
            var chartContainer = new VisualElement();
            chartContainer.style.backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1);

            if (dataManager.servers.Count == 0) return chartContainer;

            // Create chart data from server data
            var chartData = ChartManager.CreatePlayersChartData(dataManager.servers);

            // For demonstration, we'll create a simple visualization
            chartContainer.style.flexDirection = FlexDirection.Row;
            chartContainer.style.alignItems = Align.Center;
            chartContainer.style.justifyContent = Justify.Center;

            var label = new Label("Players Chart (Implementation Placeholder)");
            label.style.fontSize = 14;
            label.style.unityTextAlign = TextAnchor.MiddleCenter;

            chartContainer.Add(label);

            return chartContainer;
        }

        private VisualElement CreateServerStatusTable()
        {
            var tableContainer = new VisualElement();
            tableContainer.style.marginTop = new StyleLength(new Length(20, LengthUnit.Pixel));

            // Table header
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.backgroundColor = new Color(0.85f, 0.85f, 0.85f, 1);
            headerContainer.style.paddingTop = new StyleLength(new Length(8, LengthUnit.Pixel));
            headerContainer.style.paddingBottom = new StyleLength(new Length(8, LengthUnit.Pixel));
            headerContainer.style.paddingLeft = new StyleLength(new Length(8, LengthUnit.Pixel));
            headerContainer.style.paddingRight = new StyleLength(new Length(8, LengthUnit.Pixel));

            var serverHeader = CreateHeaderLabel("Server", 2);
            var statusHeader = CreateHeaderLabel("Status", 1);
            var cpuHeader = CreateHeaderLabel("CPU", 1);
            var memoryHeader = CreateHeaderLabel("Memory", 1);
            var playersHeader = CreateHeaderLabel("Players", 1);

            headerContainer.Add(serverHeader);
            headerContainer.Add(statusHeader);
            headerContainer.Add(cpuHeader);
            headerContainer.Add(memoryHeader);
            headerContainer.Add(playersHeader);

            tableContainer.Add(headerContainer);

            // Table rows
            foreach (var server in dataManager.servers)
            {
                var rowContainer = new VisualElement();
                rowContainer.style.flexDirection = FlexDirection.Row;
                rowContainer.style.paddingTop = new StyleLength(new Length(8, LengthUnit.Pixel));
                rowContainer.style.paddingBottom = new StyleLength(new Length(8, LengthUnit.Pixel));
                rowContainer.style.paddingLeft = new StyleLength(new Length(8, LengthUnit.Pixel));
                rowContainer.style.paddingRight = new StyleLength(new Length(8, LengthUnit.Pixel));

                // Set row background color based on status
                switch (server.status.ToLower())
                {
                    case "running":
                        rowContainer.style.backgroundColor = new Color(0.9f, 1.0f, 0.9f, 1); // Light green
                        break;
                    case "stopped":
                        rowContainer.style.backgroundColor = new Color(1.0f, 0.9f, 0.8f, 1); // Light yellow/orange
                        break;
                    case "exited":
                        rowContainer.style.backgroundColor = new Color(1.0f, 0.9f, 0.9f, 1); // Light red
                        break;
                    default:
                        rowContainer.style.backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1); // Light gray
                        break;
                }

                var serverLabel = CreateDataLabel(server.server.Replace("mc-", "").Replace("-", " "));
                var statusLabel = CreateStatusLabel(server.status);
                var cpuLabel = CreateDataLabel(server.cpu);
                var memoryLabel = CreateDataLabel(server.memory);
                var playersLabel = CreateDataLabel(server.playerCount.ToString());

                rowContainer.Add(serverLabel);
                rowContainer.Add(statusLabel);
                rowContainer.Add(cpuLabel);
                rowContainer.Add(memoryLabel);
                rowContainer.Add(playersLabel);

                tableContainer.Add(rowContainer);
            }

            return tableContainer;
        }

        private Label CreateHeaderLabel(string text, int flexBasis)
        {
            var label = new Label(text);
            label.style.flexBasis = new Length(20 * flexBasis, LengthUnit.Percent);
            label.style.unityFontStyleAndWeight = FontStyle.Bold;
            return label;
        }

        private Label CreateDataLabel(string text)
        {
            var label = new Label(text);
            label.style.flexBasis = new Length(20, LengthUnit.Percent);
            return label;
        }

        private VisualElement CreateStatusLabel(string status)
        {
            var statusContainer = new VisualElement();
            statusContainer.style.flexBasis = new Length(20, LengthUnit.Percent);
            statusContainer.style.justifyContent = Justify.Center;
            statusContainer.style.alignItems = Align.Center;

            var statusBadge = new VisualElement();
            statusBadge.style.backgroundColor = GetStatusColor(status);
            statusBadge.style.borderTopLeftRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderTopRightRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderBottomLeftRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.borderBottomRightRadius = new StyleLength(new Length(10, LengthUnit.Pixel));
            statusBadge.style.width = 80;
            statusBadge.style.height = 20;
            statusBadge.style.justifyContent = Justify.Center;
            statusBadge.style.alignItems = Align.Center;

            var statusLabel = new Label(status);
            statusLabel.style.color = Color.white;
            statusLabel.style.fontSize = 12;

            statusBadge.Add(statusLabel);
            statusContainer.Add(statusBadge);

            return statusContainer;
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
            InitializeDashboard();
        }
    }
}