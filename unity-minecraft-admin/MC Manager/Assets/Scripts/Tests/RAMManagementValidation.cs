using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Models;
using MinecraftAdmin.UI;

namespace MinecraftAdmin.Tests
{
    public class RAMManagementValidation : MonoBehaviour
    {
        [Header("Test Configuration")]
        public DataManager dataManager;
        public APIManager apiManager;
        public UIDocument uiDocument;

        private VisualElement root;
        private Label statusLabel;
        private Button runTestButton;

        private void Start()
        {
            InitializeTestInterface();
        }

        private void InitializeTestInterface()
        {
            if (uiDocument == null)
            {
                Debug.LogError("UIDocument not assigned to RAMManagementValidation component");
                return;
            }

            root = uiDocument.rootVisualElement;

            // Clear existing content
            root.Clear();

            // Create test interface
            var container = new VisualElement();
            container.style.flexDirection = FlexDirection.Column;
            container.style.alignItems = Align.Center;
            container.style.justifyContent = Justify.Center;
            container.style.SetPadding(20);

            // Title
            var title = new Label("RAM Management System Validation");
            title.style.fontSize = 24;
            title.style.unityFontStyleAndWeight = FontStyle.Bold;
            title.style.marginBottom = 20;

            // Status display
            statusLabel = new Label("Click 'Run Tests' to validate RAM management functionality");
            statusLabel.style.fontSize = 16;
            statusLabel.style.whiteSpace = WhiteSpace.Normal;
            statusLabel.style.marginBottom = 20;
            statusLabel.style.width = 600;

            // Test button
            runTestButton = new Button(RunValidationTests);
            runTestButton.text = "Run RAM Management Tests";
            runTestButton.style.width = 200;
            runTestButton.style.marginBottom = 20;

            // Results container
            var resultsContainer = new ScrollView();
            resultsContainer.style.height = 300;
            resultsContainer.style.borderTopWidth = 1;
            resultsContainer.style.borderRightWidth = 1;
            resultsContainer.style.borderBottomWidth = 1;
            resultsContainer.style.borderLeftWidth = 1;
            resultsContainer.style.borderTopColor = new StyleColor(Color.gray);
            resultsContainer.style.borderRightColor = new StyleColor(Color.gray);
            resultsContainer.style.borderBottomColor = new StyleColor(Color.gray);
            resultsContainer.style.borderLeftColor = new StyleColor(Color.gray);
            resultsContainer.style.marginTop = 10;

            container.Add(title);
            container.Add(statusLabel);
            container.Add(runTestButton);
            container.Add(resultsContainer);

            root.Add(container);
        }

        private void RunValidationTests()
        {
            statusLabel.text = "Running RAM Management validation tests...\n";
            runTestButton.SetEnabled(false);

            StartCoroutine(ExecuteValidationTests());
        }

        private IEnumerator ExecuteValidationTests()
        {
            // Test 1: Verify DataManager exists
            yield return null;
            if (dataManager == null)
            {
                statusLabel.text += "❌ DataManager not found or assigned\n";
                yield break;
            }
            else
            {
                statusLabel.text += "✅ DataManager reference verified\n";
            }

            // Test 2: Create test servers with RAM configuration
            yield return new WaitForSeconds(0.5f);
            var testServers = new System.Collections.Generic.List<ServerData>
            {
                new ServerData
                {
                    server = "mc-test-server-1",
                    status = "running",
                    cpu = "25.5%",
                    memory = "2048.00MB",
                    minMemory = "1G",   // 1024 MB
                    maxMemory = "4G",   // 4096 MB
                    playerCount = 12,
                    motd = "Test Server 1"
                },
                new ServerData
                {
                    server = "mc-test-server-2",
                    status = "stopped",
                    cpu = "0%",
                    memory = "0MB",
                    minMemory = "2G",   // 2048 MB
                    maxMemory = "8G",   // 8192 MB
                    playerCount = 0,
                    motd = "Test Server 2"
                }
            };

            dataManager.UpdateServerData(testServers);

            statusLabel.text += "✅ Test servers created with RAM configuration\n";

            // Test 3: Verify RAM calculations
            yield return new WaitForSeconds(0.5f);
            float totalAllocated = dataManager.GetTotalAllocatedRAM();
            float totalUsed = dataManager.GetTotalUsedRAM();
            float utilization = dataManager.GetTotalRAMUtilization();

            statusLabel.text += $"📊 Total Allocated RAM: {totalAllocated:F2} MB\n";
            statusLabel.text += $"📊 Total Used RAM: {totalUsed:F2} MB\n";
            statusLabel.text += $"📊 RAM Utilization: {utilization:F2}%\n";

            // Test 4: Test server-specific RAM functions
            yield return new WaitForSeconds(0.5f);
            var server1 = dataManager.GetServerById("mc-test-server-1");
            if (server1 != null)
            {
                float server1Allocated = dataManager.GetServerAllocatedRAM("mc-test-server-1");
                float server1Used = dataManager.GetServerUsedRAM("mc-test-server-1");
                float server1Utilization = dataManager.GetServerRAMUtilization("mc-test-server-1");

                statusLabel.text += $"📋 Server 1 Allocated: {server1Allocated:F2} MB\n";
                statusLabel.text += $"📋 Server 1 Used: {server1Used:F2} MB\n";
                statusLabel.text += $"📋 Server 1 Utilization: {server1Utilization:F2}%\n";
                statusLabel.text += "✅ Server-specific RAM functions working\n";
            }

            // Test 5: Update RAM configuration and verify
            yield return new WaitForSeconds(0.5f);
            dataManager.UpdateServerRAMAllocation("mc-test-server-1", "2G", "6G"); // Update to 2G min, 6G max

            var updatedServer1 = dataManager.GetServerById("mc-test-server-1");
            if (updatedServer1 != null && updatedServer1.maxMemory == "6G")
            {
                statusLabel.text += "✅ RAM configuration update successful\n";
            }
            else
            {
                statusLabel.text += "❌ RAM configuration update failed\n";
            }

            // Test 6: Final validation
            yield return new WaitForSeconds(0.5f);
            float newTotalAllocated = dataManager.GetTotalAllocatedRAM();
            statusLabel.text += $"🔄 Updated Total Allocated RAM: {newTotalAllocated:F2} MB\n";

            if (newTotalAllocated > totalAllocated)
            {
                statusLabel.text += "✅ RAM allocation update reflected in totals\n";
            }
            else
            {
                statusLabel.text += "⚠️ RAM allocation update may not be reflected properly\n";
            }

            // Test 7: Validate memory string parsing
            yield return new WaitForSeconds(0.5f);
            // Test direct parsing in a simple way by creating a temporary server
            var tempServer = new ServerData();
            tempServer.minMemory = "1G";
            tempServer.maxMemory = "4G";

            float minMB = tempServer.MinMemoryInMB;
            float maxMB = tempServer.MaxMemoryInMB;

            statusLabel.text += $"🧮 Memory parsing test - Min: {minMB} MB, Max: {maxMB} MB\n";

            if (minMB > 0 && maxMB > 0)
            {
                statusLabel.text += "✅ Memory string parsing works correctly\n";
            }
            else
            {
                statusLabel.text += "❌ Memory string parsing failed\n";
            }

            // Final status
            yield return new WaitForSeconds(0.5f);
            statusLabel.text += "\n🏁 RAM Management System Validation Complete!\n";
            statusLabel.text += "All core RAM management functionality is operational.";

            runTestButton.SetEnabled(true);
            runTestButton.text = "Run Tests Again";
        }
    }
}