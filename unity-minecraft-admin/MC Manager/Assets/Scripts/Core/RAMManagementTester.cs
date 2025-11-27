using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Managers;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.Core
{
    public class RAMManagementTester : MonoBehaviour
    {
        [Header("References")]
        public DataManager dataManager;
        public APIManager apiManager;
        public UIDocument uiDocument;
        
        private Label statusLabel;
        private Button testButton;
        private VisualElement root;
        
        private void Start()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
                SetupTestUI();
            }
        }
        
        private void SetupTestUI()
        {
            root.style.flexDirection = FlexDirection.Column;
            root.style.alignItems = Align.Center;
            root.style.justifyContent = Justify.Center;
            root.style.height = new Length(100, LengthUnit.Percent);
            
            // Title
            var title = new Label("RAM Management Test Interface");
            title.style.fontSize = 24;
            title.style.unityFontStyleAndWeight = FontStyle.Bold;
            title.style.marginBottom = 20;
            
            // Status label
            statusLabel = new Label("Ready to test RAM management functionality");
            statusLabel.style.fontSize = 16;
            statusLabel.style.marginBottom = 20;
            statusLabel.style.whiteSpace = WhiteSpace.Normal;
            statusLabel.style.width = 500;
            
            // Test buttons
            var testButtonsContainer = new VisualElement();
            testButtonsContainer.style.flexDirection = FlexDirection.Row;
            testButtonsContainer.style.justifyContent = Justify.Center;
            testButtonsContainer.style.marginBottom = 10;
            
            var testServerConfigButton = new Button(TestServerConfig);
            testServerConfigButton.text = "Test Server Config";
            testServerConfigButton.style.marginRight = 10;
            
            var testRAMCalculationButton = new Button(TestRAMCalculations);
            testRAMCalculationButton.text = "Test RAM Calculations";
            testRAMCalculationButton.style.marginRight = 10;
            
            var testMemoryParsingButton = new Button(TestMemoryParsing);
            testMemoryParsingButton.text = "Test Memory Parsing";
            
            testButtonsContainer.Add(testServerConfigButton);
            testButtonsContainer.Add(testRAMCalculationButton);
            testButtonsContainer.Add(testMemoryParsingButton);
            
            // RAM visualization test button
            var testVisualizationButton = new Button(TestVisualizationUpdate);
            testVisualizationButton.text = "Test RAM Visualization Update";
            testVisualizationButton.style.marginTop = 10;
            testVisualizationButton.style.marginBottom = 10;
            
            // Return to app button
            var returnButton = new Button(() => {
                // In a real app, we would return to the main scene
                statusLabel.text = "Returning to main app...";
            });
            returnButton.text = "Return to Main App";
            returnButton.style.width = 200;
            returnButton.style.marginTop = 10;
            
            root.Add(title);
            root.Add(statusLabel);
            root.Add(testButtonsContainer);
            root.Add(testVisualizationButton);
            root.Add(returnButton);
        }
        
        private void TestServerConfig()
        {
            statusLabel.text = "Testing server configuration functionality...\n";
            
            if (dataManager == null)
            {
                statusLabel.text += "ERROR: DataManager not assigned\n";
                return;
            }
            
            // Add some test servers to the data manager if none exist
            if (dataManager.servers.Count == 0)
            {
                var testServers = new List<ServerData>
                {
                    new ServerData 
                    { 
                        server = "mc-test-server", 
                        status = "running", 
                        cpu = "25.5%", 
                        memory = "2048.00MB",
                        minMemory = "1G",
                        maxMemory = "4G",
                        playerCount = 12 
                    },
                    new ServerData 
                    { 
                        server = "mc-test-server-2", 
                        status = "stopped", 
                        cpu = "N/A", 
                        memory = "N/A",
                        minMemory = "2G",
                        maxMemory = "8G",
                        playerCount = 0 
                    }
                };
                
                dataManager.UpdateServerData(testServers);
            }
            
            statusLabel.text += $"SUCCESS: DataManager has {dataManager.servers.Count} servers\n";
            
            // Test RAM allocation update
            dataManager.UpdateServerRAMAllocation("mc-test-server", "2G", "6G");
            var updatedServer = dataManager.GetServerById("mc-test-server");
            if (updatedServer != null)
            {
                statusLabel.text += $"SUCCESS: Updated RAM allocation for {updatedServer.server}\n";
                statusLabel.text += $"New Min Memory: {updatedServer.minMemory}, Max Memory: {updatedServer.maxMemory}\n";
            }
            
            // Test RAM calculations
            var totalAllocated = dataManager.GetTotalAllocatedRAM();
            var totalUsed = dataManager.GetTotalUsedRAM();
            var utilization = dataManager.GetTotalRAMUtilization();
            
            statusLabel.text += $"Total Allocated RAM: {totalAllocated:F2} MB\n";
            statusLabel.text += $"Total Used RAM: {totalUsed:F2} MB\n";
            statusLabel.text += $"RAM Utilization: {utilization:F2}%\n";
        }
        
        private void TestRAMCalculations()
        {
            statusLabel.text = "Testing RAM calculation methods...\n";
            
            if (dataManager == null)
            {
                statusLabel.text += "ERROR: DataManager not assigned\n";
                return;
            }
            
            // Add test servers with different RAM values
            var testServers = new List<ServerData>
            {
                new ServerData 
                { 
                    server = "mc-test-1", 
                    status = "running", 
                    cpu = "20%", 
                    memory = "1024.00MB",
                    minMemory = "1G",  // 1024 MB
                    maxMemory = "4G",  // 4096 MB
                    playerCount = 5 
                },
                new ServerData 
                { 
                    server = "mc-test-2", 
                    status = "running", 
                    cpu = "30%", 
                    memory = "2048.00MB",
                    minMemory = "2G",  // 2048 MB
                    maxMemory = "8G",  // 8192 MB
                    playerCount = 10 
                }
            };
            
            dataManager.UpdateServerData(testServers);
            
            var totalAllocated = dataManager.GetTotalAllocatedRAM();
            var totalUsed = dataManager.GetTotalUsedRAM();
            var utilization = dataManager.GetTotalRAMUtilization();
            
            statusLabel.text += $"Test Server 1 - Min: {testServers[0].MinMemoryInMB} MB, Max: {testServers[0].MaxMemoryInMB} MB\n";
            statusLabel.text += $"Test Server 2 - Min: {testServers[1].MinMemoryInMB} MB, Max: {testServers[1].MaxMemoryInMB} MB\n";
            statusLabel.text += $"Total Allocated: {totalAllocated:F2} MB\n";
            statusLabel.text += $"Total Used: {totalUsed:F2} MB\n";
            statusLabel.text += $"Utilization: {utilization:F2}%\n";
            
            // Validate calculations
            float expectedTotalAllocated = 4096f + 8192f; // 4G + 8G in MB
            if (Mathf.Abs(totalAllocated - expectedTotalAllocated) < 0.1f)
            {
                statusLabel.text += "SUCCESS: Total allocated RAM calculation is correct\n";
            }
            else
            {
                statusLabel.text += $"ERROR: Expected {expectedTotalAllocated} MB, got {totalAllocated} MB\n";
            }
        }
        
        private void TestMemoryParsing()
        {
            statusLabel.text = "Testing memory string parsing...\n";
            
            // Test different memory formats
            string[] testValues = { "1G", "2048M", "1024", "4g", "512m", "2048K", "1048576B" };
            float[] expectedMB = { 1024f, 2048f, 1024f, 4096f, 512f, 2f, 1f };
            
            for (int i = 0; i < testValues.Length; i++)
            {
                // Create a temp server data object to test memory parsing
                var tempServer = new ServerData();
                
                switch (i)
                {
                    case 0: tempServer.maxMemory = testValues[i]; break;
                    case 1: tempServer.maxMemory = testValues[i]; break;
                    case 2: tempServer.maxMemory = testValues[i]; break;
                    case 3: tempServer.maxMemory = testValues[i]; break;
                    case 4: tempServer.maxMemory = testValues[i]; break;
                    case 5: tempServer.maxMemory = testValues[i]; break;
                    case 6: tempServer.maxMemory = testValues[i]; break;
                }
                
                float result = tempServer.MaxMemoryInMB;
                
                if (Mathf.Abs(result - expectedMB[i]) < 0.1f)
                {
                    statusLabel.text += $"SUCCESS: {testValues[i]} parsed as {result} MB (expected {expectedMB[i]} MB)\n";
                }
                else
                {
                    statusLabel.text += $"ERROR: {testValues[i]} parsed as {result} MB (expected {expectedMB[i]} MB)\n";
                }
            }
        }
        
        private void TestVisualizationUpdate()
        {
            statusLabel.text = "Testing RAM visualization update functionality...\n";
            
            // Create a visual representation of RAM utilization
            if (dataManager != null && dataManager.servers.Count > 0)
            {
                string visualReport = "RAM Visualization Report:\n";
                
                foreach (var server in dataManager.servers)
                {
                    float allocated = server.MaxMemoryInMB;
                    float used = server.MemoryInMB;
                    float utilization = allocated > 0 ? (used / allocated) * 100 : 0;
                    
                    visualReport += $"\n{server.server}:\n";
                    visualReport += $"  Allocated: {allocated:F2} MB\n";
                    visualReport += $"  Used: {used:F2} MB\n";
                    visualReport += $"  Utilization: {utilization:F2}%\n";
                    
                    // Visual representation
                    int bars = Mathf.Clamp(Mathf.RoundToInt(utilization / 5), 0, 20); // Max 20 bars for 100%
                    string barsVisual = new string('█', bars) + new string('░', 20 - bars);
                    visualReport += $"  [{barsVisual}] {utilization:F2}%\n";
                }
                
                statusLabel.text += visualReport;
            }
            else
            {
                statusLabel.text += "No server data available for visualization test.\n";
                statusLabel.text += "Try running Test RAM Calculations first.";
            }
        }
    }
}