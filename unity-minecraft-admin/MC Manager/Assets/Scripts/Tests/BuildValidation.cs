using UnityEngine;
using System.Collections.Generic;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Managers;  // This includes ServerPollingService
using MinecraftAdmin.Models;   // This includes ServerData

namespace MinecraftAdmin.Tests
{
    /// <summary>
    /// This script runs a basic compilation test to ensure all components work together
    /// </summary>
    public class BuildValidation : MonoBehaviour
    {
        public DataManager dataManager;
        public APIManager apiManager;
        public ServerPollingService pollingService;

        private void Start()
        {
            Debug.Log("Build validation started - all required components compiled successfully");

            // Test basic functionality that relies on RAM management features
            TestRAMManagement();
        }

        private void TestRAMManagement()
        {
            Debug.Log("Testing RAM management functionality...");

            // Create a test server to verify RAM calculations work
            var testServer = new ServerData
            {
                server = "test-server",
                status = "running",
                cpu = "25.0%",
                memory = "2048.00MB",
                minMemory = "1G",   // 1024 MB
                maxMemory = "4G",   // 4096 MB
                playerCount = 15
            };

            // Test memory calculations
            float minMemoryMB = testServer.MinMemoryInMB;
            float maxMemoryMB = testServer.MaxMemoryInMB;
            float memoryInUse = testServer.MemoryInMB;

            Debug.Log($"Test server RAM values - Min: {minMemoryMB} MB, Max: {maxMemoryMB} MB, Used: {memoryInUse} MB");

            // Verify calculations are working
            if (minMemoryMB > 0 && maxMemoryMB > 0 && maxMemoryMB >= minMemoryMB)
            {
                Debug.Log("✓ RAM calculations are working correctly");
            }
            else
            {
                Debug.LogError("✗ RAM calculations failed");
            }

            // Test with DataManager if available
            if (dataManager != null)
            {
                var testServers = new List<ServerData> { testServer };
                dataManager.UpdateServerData(testServers);

                float totalAllocated = dataManager.GetTotalAllocatedRAM();
                float totalUsed = dataManager.GetTotalUsedRAM();
                float utilization = dataManager.GetTotalRAMUtilization();

                Debug.Log($"DataManager RAM stats - Total Allocated: {totalAllocated} MB, Total Used: {totalUsed} MB, Utilization: {utilization}%");

                if (totalAllocated > 0)
                {
                    Debug.Log("✓ DataManager RAM management functions working");
                }
                else
                {
                    Debug.LogError("✗ DataManager RAM management functions failed");
                }
            }

            Debug.Log("RAM management validation completed");
        }
    }
}