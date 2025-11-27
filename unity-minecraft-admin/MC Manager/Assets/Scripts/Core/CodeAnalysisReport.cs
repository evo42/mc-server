using UnityEngine;
using System.Collections.Generic;
using System.Reflection;
using MinecraftAdmin.Data;
using MinecraftAdmin.Models;
using MinecraftAdmin.API;

namespace MinecraftAdmin.Core
{
    public class CodeAnalysisReport : MonoBehaviour
    {
        [Header("Analysis Configuration")]
        public bool runAnalysisOnStart = true;
        
        [Header("Results")]
        public int totalClassesAnalyzed = 0;
        public int totalMethodsAnalyzed = 0;
        public int totalPropertiesFound = 0;
        public int totalRAMManagementFeatures = 0;
        
        public List<string> analysisResults = new List<string>();
        
        private void Start()
        {
            if (runAnalysisOnStart)
            {
                PerformCodeAnalysis();
            }
        }
        
        public void PerformCodeAnalysis()
        {
            Debug.Log("=== Unity Minecraft Admin Panel - Code Analysis Report ===");
            
            analysisResults.Clear();
            
            // Check for RAM management features
            CheckRAMManagementFeatures();
            
            // Count total classes
            CountClassesAndMethods();
            
            // Print analysis results
            foreach (string result in analysisResults)
            {
                Debug.Log(result);
            }
            
            Debug.Log("=== Analysis Complete ===");
            Debug.Log($"Total Classes Analyzed: {totalClassesAnalyzed}");
            Debug.Log($"Total Methods Analyzed: {totalMethodsAnalyzed}");
            Debug.Log($"Total Properties Found: {totalPropertiesFound}");
            Debug.Log($"RAM Management Features Identified: {totalRAMManagementFeatures}");
        }
        
        private void CheckRAMManagementFeatures()
        {
            analysisResults.Add("--- RAM Management Features ---");
            
            // Check ServerData properties
            var serverDataType = typeof(ServerData);
            var minMemoryProp = serverDataType.GetProperty("minMemory");
            var maxMemoryProp = serverDataType.GetProperty("maxMemory");
            var minMemoryInMBProp = serverDataType.GetProperty("MinMemoryInMB");
            var maxMemoryInMBProp = serverDataType.GetProperty("MaxMemoryInMB");
            var memoryInMBProp = serverDataType.GetProperty("MemoryInMB");
            
            if (minMemoryProp != null) { 
                totalRAMManagementFeatures++; 
                analysisResults.Add("✓ ServerData.minMemory property found");
            }
            if (maxMemoryProp != null) { 
                totalRAMManagementFeatures++; 
                analysisResults.Add("✓ ServerData.maxMemory property found");
            }
            if (minMemoryInMBProp != null) { 
                totalRAMManagementFeatures++; 
                analysisResults.Add("✓ ServerData.MinMemoryInMB property found");
            }
            if (maxMemoryInMBProp != null) { 
                totalRAMManagementFeatures++; 
                analysisResults.Add("✓ ServerData.MaxMemoryInMB property found");
            }
            if (memoryInMBProp != null) { 
                totalRAMManagementFeatures++; 
                analysisResults.Add("✓ ServerData.MemoryInMB property found");
            }
            
            // Check DataManager methods
            var dataManagerType = typeof(DataManager);
            var updateServerRAMMethod = dataManagerType.GetMethod("UpdateServerRAMAllocation");
            var getTotalAllocatedRAMMethod = dataManagerType.GetMethod("GetTotalAllocatedRAM");
            var getTotalUsedRAMMethod = dataManagerType.GetMethod("GetTotalUsedRAM");
            var getTotalRAMUtilizationMethod = dataManagerType.GetMethod("GetTotalRAMUtilization");
            var getServerRAMUtilizationMethod = dataManagerType.GetMethod("GetServerRAMUtilization");
            
            if (updateServerRAMMethod != null) {
                totalRAMManagementFeatures++;
                analysisResults.Add("✓ DataManager.UpdateServerRAMAllocation method found");
            }
            if (getTotalAllocatedRAMMethod != null) {
                totalRAMManagementFeatures++;
                analysisResults.Add("✓ DataManager.GetTotalAllocatedRAM method found");
            }
            if (getTotalUsedRAMMethod != null) {
                totalRAMManagementFeatures++;
                analysisResults.Add("✓ DataManager.GetTotalUsedRAM method found");
            }
            if (getTotalRAMUtilizationMethod != null) {
                totalRAMManagementFeatures++;
                analysisResults.Add("✓ DataManager.GetTotalRAMUtilization method found");
            }
            if (getServerRAMUtilizationMethod != null) {
                totalRAMManagementFeatures++;
                analysisResults.Add("✓ DataManager.GetServerRAMUtilization method found");
            }
        }
        
        private void CountClassesAndMethods()
        {
            analysisResults.Add("\n--- Code Statistics ---");
            
            var assemblies = System.AppDomain.CurrentDomain.GetAssemblies();
            
            // Count classes in the MinecraftAdmin namespace
            foreach (var assembly in assemblies)
            {
                var classes = assembly.GetTypes();
                
                foreach (var cls in classes)
                {
                    if (cls.Namespace != null && cls.Namespace.StartsWith("MinecraftAdmin") && cls.IsClass)
                    {
                        totalClassesAnalyzed++;
                        
                        var methods = cls.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                        totalMethodsAnalyzed += methods.Length;
                        
                        var properties = cls.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                        totalPropertiesFound += properties.Length;
                    }
                }
            }
            
            analysisResults.Add($"Total MinecraftAdmin Classes: {totalClassesAnalyzed}");
            analysisResults.Add($"Total Methods: {totalMethodsAnalyzed}");
            analysisResults.Add($"Total Properties: {totalPropertiesFound}");
        }
    }
}