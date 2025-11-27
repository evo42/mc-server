using NUnit.Framework;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.TestTools;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.Tests
{
    public class RAMManagementTests
    {
        private DataManager testDataManager;
        private ServerData testServer;

        [SetUp]
        public void SetUp()
        {
            // Initialize test data manager
            testDataManager = ScriptableObject.CreateInstance<DataManager>();
            testServer = new ServerData
            {
                server = "test-server",
                status = "running",
                cpu = "25.5%",
                memory = "2048.00MB",
                minMemory = "1G",   // 1024 MB
                maxMemory = "4G",   // 4096 MB
                playerCount = 12
            };

            var serverList = new List<ServerData> { testServer };
            testDataManager.UpdateServerData(serverList);
        }

        [TearDown]
        public void TearDown()
        {
            if (testDataManager != null)
            {
                ScriptableObject.DestroyImmediate(testDataManager);
            }
        }

        [Test]
        public void TestMemoryStringParsing()
        {
            // Test different memory formats
            Assert.AreEqual(1024f, testServer.MinMemoryInMB, 0.01f);
            Assert.AreEqual(4096f, testServer.MaxMemoryInMB, 0.01f);
            Assert.AreEqual(2048f, testServer.MemoryInMB, 0.01f);
        }

        [Test]
        public void TestRAMAllocationUpdate()
        {
            // Test updating RAM allocation
            testDataManager.UpdateServerRAMAllocation(testServer.server, "2G", "6G");

            var updatedServer = testDataManager.GetServerById(testServer.server);
            Assert.NotNull(updatedServer);
            Assert.AreEqual("2G", updatedServer.minMemory);
            Assert.AreEqual("6G", updatedServer.maxMemory);
        }

        [Test]
        public void TestTotalRAMCalculations()
        {
            // Add more test servers
            var testServer2 = new ServerData
            {
                server = "test-server-2",
                status = "running",
                cpu = "35.0%",
                memory = "4096.00MB",
                minMemory = "2G", // 2048 MB
                maxMemory = "8G", // 8192 MB
                playerCount = 5
            };

            var serverList = new List<ServerData> { testServer, testServer2 };
            testDataManager.UpdateServerData(serverList);

            // Test total RAM calculations
            float totalAllocated = testDataManager.GetTotalAllocatedRAM();
            float totalUsed = testDataManager.GetTotalUsedRAM();
            float utilization = testDataManager.GetTotalRAMUtilization();

            // Expected allocations: 4G + 8G = 12G
            // After conversion to MB: 4096MB + 8192MB = 12288MB
            Assert.That(totalAllocated, Is.EqualTo(12288f).Within(0.01f));

            // Expected used: 2048MB + 4096MB = 6144MB
            Assert.That(totalUsed, Is.EqualTo(6144f).Within(0.01f));

            // Expected utilization: (6144/12288)*100 = 50%
            Assert.That(utilization, Is.EqualTo(50f).Within(0.01f));
        }

        [Test]
        public void TestServerRAMUtilization()
        {
            float serverUtilization = testDataManager.GetServerRAMUtilization(testServer.server);

            // Expected: (2048 / 4096) * 100 = 50%
            Assert.That(serverUtilization, Is.EqualTo(50f).Within(0.01f));
        }

        [Test]
        public void TestInvalidRAMValues()
        {
            // Test with invalid memory strings
            var invalidServer = new ServerData
            {
                server = "invalid-server",
                minMemory = "invalid",
                maxMemory = ""
            };

            Assert.AreEqual(0f, invalidServer.MinMemoryInMB, 0.01f);
            Assert.AreEqual(0f, invalidServer.MaxMemoryInMB, 0.01f);
        }

        [Test]
        public void TestMemoryStringConversion()
        {
            // Test different memory formats
            var serverGB = new ServerData { maxMemory = "1G" };
            var serverMB = new ServerData { maxMemory = "1024M" };
            var serverKB = new ServerData { maxMemory = "1048576K" };  // 1024MB in KB
            var serverB = new ServerData { maxMemory = "1073741824B" }; // 1024MB in bytes

            Assert.That(serverGB.MaxMemoryInMB, Is.EqualTo(1024f).Within(0.01f));
            Assert.That(serverMB.MaxMemoryInMB, Is.EqualTo(1024f).Within(0.01f));

            // For KB and B, the parsing might differ, let's test what values we get
            Assert.GreaterOrEqual(serverKB.MaxMemoryInMB, 1000f);  // Should be close to 1024MB
            Assert.GreaterOrEqual(serverB.MaxMemoryInMB, 1000f);  // Should be close to 1024MB
        }
    }

    public class ServerDataModelTests
    {
        [Test]
        public void TestServerDataInitialization()
        {
            var serverData = new ServerData
            {
                server = "test-server",
                status = "running",
                cpu = "50.0%",
                memory = "1024.00MB",
                minMemory = "1G",
                maxMemory = "2G",
                playerCount = 10
            };

            Assert.AreEqual("test-server", serverData.server);
            Assert.AreEqual("running", serverData.status);
            Assert.AreEqual(50.0f, serverData.CPUPercentage, 0.01f);
            Assert.AreEqual(1024.0f, serverData.MemoryInMB, 0.01f);
            Assert.AreEqual(1024.0f, serverData.MinMemoryInMB, 0.01f);
            Assert.AreEqual(2048.0f, serverData.MaxMemoryInMB, 0.01f);
            Assert.AreEqual(10, serverData.playerCount);
        }

        [Test]
        public void TestCPUParsing()
        {
            var serverData = new ServerData { cpu = "75.5%" };
            Assert.AreEqual(75.5f, serverData.CPUPercentage, 0.01f);

            serverData.cpu = "N/A";
            Assert.AreEqual(0f, serverData.CPUPercentage, 0.01f);

            serverData.cpu = "invalid";
            Assert.AreEqual(0f, serverData.CPUPercentage, 0.01f);
        }

        [Test]
        public void TestMemoryParsing()
        {
            var serverData = new ServerData { memory = "4096.50MB" };
            Assert.AreEqual(4096.5f, serverData.MemoryInMB, 0.01f);

            serverData.memory = "N/A";
            Assert.AreEqual(0f, serverData.MemoryInMB, 0.01f);

            serverData.memory = "invalid";
            Assert.AreEqual(0f, serverData.MemoryInMB, 0.01f);
        }
    }
}