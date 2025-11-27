using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using System.Linq;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.UI
{
    public class ChartManager : MonoBehaviour
    {
        [System.Serializable]
        public class ChartData
        {
            public string label;
            public float value;
            public Color color;
        }

        public enum ChartType
        {
            Bar,
            Line,
            Doughnut
        }

        [Header("Chart Configuration")]
        public ChartType chartType;
        public List<ChartData> chartData = new List<ChartData>();
        public Color backgroundColor = Color.white;
        public Color textColor = Color.black;

        [Header("UI References")]
        public VisualElement chartContainer;
        public VisualTreeAsset barTemplate; // For bar charts
        public VisualTreeAsset linePointTemplate; // For line charts
        public VisualTreeAsset doughnutSegmentTemplate; // For doughnut charts
        public Label titleLabel;

        [Header("Chart Settings")]
        public float barWidth = 30f;
        public float barSpacing = 10f;
        public float chartHeight = 200f;
        public float chartWidth = 400f;

        private List<GameObject> chartElements = new List<GameObject>();

        public void InitializeChart(ChartType type, List<ChartData> data, string title = "")
        {
            chartType = type;
            chartData = data;

            if (titleLabel != null)
                titleLabel.text = title;

            RedrawChart();
        }

        public void UpdateChartData(List<ChartData> data)
        {
            chartData = data;
            RedrawChart();
        }

        private void RedrawChart()
        {
            // Clear existing chart elements
            foreach (var element in chartElements)
            {
                if (element != null)
                    DestroyImmediate(element);
            }
            chartElements.Clear();

            // Draw chart based on type
            switch (chartType)
            {
                case ChartType.Bar:
                    DrawBarChart();
                    break;
                case ChartType.Line:
                    DrawLineChart();
                    break;
                case ChartType.Doughnut:
                    DrawDoughnutChart();
                    break;
            }
        }

        private void DrawBarChart()
        {
            if (chartContainer == null) return;

            // Clear existing chart elements
            chartContainer.Clear();

            // Calculate scaling factors
            float maxValue = chartData.Count > 0 ? chartData.Max(d => d.value) : 100f;
            if (maxValue == 0) maxValue = 100f; // Avoid division by zero
            float heightScale = chartHeight / maxValue;

            // Calculate the total width required to fit all bars
            float totalBarWidth = (barWidth + barSpacing) * chartData.Count - barSpacing;
            float startX = -totalBarWidth / 2f; // Center the bars

            for (int i = 0; i < chartData.Count; i++)
            {
                var data = chartData[i];

                // Create bar as a VisualElement
                var barElement = new VisualElement();

                // Set bar size based on value
                float barHeight = data.value * heightScale;
                barElement.style.width = barWidth;
                barElement.style.height = Mathf.Abs(barHeight);

                // Position the bar
                float x = startX + i * (barWidth + barSpacing);
                barElement.style.left = x;
                barElement.style.bottom = 0; // Position from bottom

                // Set bar color
                barElement.style.backgroundColor = data.color;

                // Add to container
                chartContainer.Add(barElement);

                // Add label for the value
                CreateValueLabel(barElement, data.value.ToString("F1"), data.color);
            }
        }

        private void CreateValueLabel(VisualElement parentElement, string text, Color color)
        {
            var labelElement = new Label(text);
            labelElement.style.color = color;
            labelElement.style.fontSize = 12;
            labelElement.style.unityTextAlign = UnityEngine.TextAnchor.MiddleCenter;
            labelElement.style.position = Position.Absolute;
            labelElement.style.left = 0;  // Center horizontally
            labelElement.style.top = -15;  // Position above the bar

            // Add to parent element
            parentElement.Add(labelElement);
        }

        private void DrawLineChart()
        {
            if (chartContainer == null) return;

            if (chartData.Count < 2) return; // Need at least 2 points for a line

            // Clear existing chart elements
            chartContainer.Clear();

            // Calculate scaling factors
            float maxValue = chartData.Count > 0 ? chartData.Max(d => d.value) : 100f;
            if (maxValue == 0) maxValue = 100f;
            float heightScale = chartHeight / maxValue;

            float sectionWidth = chartWidth / Mathf.Max(1, chartData.Count - 1);

            // Create points
            VisualElement prevPointElement = null;
            for (int i = 0; i < chartData.Count; i++)
            {
                var data = chartData[i];

                // Create point as a VisualElement
                var pointElement = new VisualElement();
                pointElement.style.width = 8;
                pointElement.style.height = 8;
                pointElement.style.position = Position.Absolute;

                // Position the point
                float x = -chartWidth / 2f + i * sectionWidth;
                float y = chartHeight / 2f - (data.value * heightScale); // Position based on value (inverted for UI toolkit)
                pointElement.style.left = x;
                pointElement.style.top = y;

                // Set point color
                pointElement.style.backgroundColor = data.color;
                pointElement.style.SetBorderRadius(4); // Make it circular

                // Add to container
                chartContainer.Add(pointElement);

                // Draw line between points
                if (prevPointElement != null)
                {
                    // Calculate positions
                    float prevX = prevPointElement.style.left.value.value;
                    float prevY = prevPointElement.style.top.value.value;

                    // Create line element
                    CreateLine(prevPointElement, pointElement, data.color);
                }

                prevPointElement = pointElement;
            }
        }

        private void CreateLine(VisualElement point1Element, VisualElement point2Element, Color color)
        {
            // Get the positions of the two points
            float x1 = point1Element.style.left.value.value;
            float y1 = point1Element.style.top.value.value;
            float x2 = point2Element.style.left.value.value;
            float y2 = point2Element.style.top.value.value;

            // Calculate line properties
            float length = Mathf.Sqrt(Mathf.Pow(x2 - x1, 2) + Mathf.Pow(y2 - y1, 2)); // Distance between points
            float angle = Mathf.Atan2(y2 - y1, x2 - x1) * Mathf.Rad2Deg; // Angle in degrees

            // Create line element
            var lineElement = new VisualElement();
            lineElement.style.position = Position.Absolute;
            lineElement.style.width = length;
            lineElement.style.height = 2; // Thickness of the line
            lineElement.style.backgroundColor = color;
            lineElement.style.left = x1;
            lineElement.style.top = y1;
            lineElement.style.rotate = new Rotate(angle);

            // Add to container
            chartContainer.Add(lineElement);
        }

        private void DrawDoughnutChart()
        {
            if (chartContainer == null) return;

            // Calculate total value for percentage calculation
            float totalValue = chartData.Sum(d => d.value);
            if (totalValue == 0) return;

            float currentAngle = 0f;

            foreach (var data in chartData)
            {
                float segmentAngle = (data.value / totalValue) * 360f;

                // Create segment as a VisualElement
                var segmentElement = new VisualElement();
                segmentElement.style.position = Position.Absolute;
                segmentElement.style.width = 100;
                segmentElement.style.height = 100;

                // For simplicity in UI Toolkit, creating circular segment is complex
                // Instead, we'll add a placeholder for the doughnut chart with a simple representation
                segmentElement.style.backgroundColor = data.color;
                segmentElement.style.SetBorderRadius(50); // Create a circular appearance
                segmentElement.style.opacity = 0.8f;

                // Position the segment in a circular pattern
                float radius = 50f; // Radius of the doughnut
                float midAngle = currentAngle + segmentAngle / 2f;

                // Convert polar coordinates to Cartesian for positioning
                float midAngleRad = midAngle * Mathf.Deg2Rad;
                float centerX = Mathf.Cos(midAngleRad) * radius;
                float centerY = Mathf.Sin(midAngleRad) * radius;

                segmentElement.style.left = centerX;
                segmentElement.style.top = centerY;

                // Add to container
                chartContainer.Add(segmentElement);

                currentAngle += segmentAngle;
            }
        }

        // Helper method to create chart data from server data
        public static List<ChartData> CreateCPUChartData(List<ServerData> servers)
        {
            var chartData = new List<ChartData>();
            Color[] colors = { Color.blue, Color.cyan, Color.green, Color.yellow, Color.orange, Color.red, Color.magenta, Color.grey };

            for (int i = 0; i < servers.Count; i++)
            {
                var server = servers[i];
                float cpuValue = server.CPUPercentage;

                chartData.Add(new ChartData
                {
                    label = server.server,
                    value = cpuValue,
                    color = colors[i % colors.Length]
                });
            }

            return chartData;
        }

        public static List<ChartData> CreateMemoryChartData(List<ServerData> servers)
        {
            var chartData = new List<ChartData>();
            Color[] colors = { Color.blue, Color.cyan, Color.green, Color.yellow, Color.orange, Color.red, Color.magenta, Color.grey };

            for (int i = 0; i < servers.Count; i++)
            {
                var server = servers[i];
                float memoryValue = server.MemoryInMB;

                chartData.Add(new ChartData
                {
                    label = server.server,
                    value = memoryValue,
                    color = colors[i % colors.Length]
                });
            }

            return chartData;
        }

        public static List<ChartData> CreateStatusChartData(List<ServerData> servers)
        {
            var statusCounts = new Dictionary<string, int>();

            foreach (var server in servers)
            {
                if (statusCounts.ContainsKey(server.status))
                    statusCounts[server.status]++;
                else
                    statusCounts[server.status] = 1;
            }

            var chartData = new List<ChartData>();
            Color[] colors = { Color.green, Color.red, Color.yellow, Color.blue }; // Running, Exited, Stopped, Paused
            string[] statusTypes = { "running", "exited", "stopped", "paused" };

            for (int i = 0; i < statusTypes.Length; i++)
            {
                string status = statusTypes[i];
                if (statusCounts.ContainsKey(status))
                {
                    chartData.Add(new ChartData
                    {
                        label = status,
                        value = statusCounts[status],
                        color = colors[i]
                    });
                }
            }

            return chartData;
        }

        public static List<ChartData> CreatePlayersChartData(List<ServerData> servers)
        {
            var chartData = new List<ChartData>();
            Color[] colors = { Color.blue, Color.cyan, Color.green, Color.yellow, Color.orange, Color.red, Color.magenta, Color.grey };

            for (int i = 0; i < servers.Count; i++)
            {
                var server = servers[i];

                chartData.Add(new ChartData
                {
                    label = server.server,
                    value = server.playerCount,
                    color = colors[i % colors.Length]
                });
            }

            return chartData;
        }
    }
}