using System.Collections.Generic;
using UnityEngine;
using MinecraftAdmin.Models;
using MinecraftAdmin.Data;

namespace MinecraftAdmin.Visualization
{
    public class ServerCube : MonoBehaviour
    {
        [Header("Server Reference")]
        public string serverName;

        [Header("Visual Properties")]
        public Renderer cubeRenderer;
        public Color runningColor = Color.green;
        public Color stoppedColor = Color.red;
        public Color exitingColor = Color.yellow;
        public Color defaultColor = Color.gray;

        [Header("Animation Properties")]
        public float rotationSpeed = 1f;
        public float pulseSpeed = 1f;
        public float pulseAmount = 0.1f;

        private Vector3 originalScale;
        private float initialSize = 1f;

        void Start()
        {
            originalScale = transform.localScale;
            
            if (cubeRenderer == null)
                cubeRenderer = GetComponent<Renderer>();
        }

        void Update()
        {
            // Rotate the cube
            transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime);
            transform.Rotate(Vector3.right, rotationSpeed * 0.5f * Time.deltaTime);
            
            // Add pulsing effect based on CPU usage
            float pulse = Mathf.Sin(Time.time * pulseSpeed) * pulseAmount + 1f;
            transform.localScale = originalScale * pulse;
        }

        public void UpdateVisual(ServerData serverData)
        {
            if (serverData == null) return;

            // Update color based on status and CPU usage
            Color newColor = GetColorForServer(serverData);
            if (cubeRenderer != null)
            {
                cubeRenderer.material.color = newColor;
            }

            // Update size based on multiple factors including RAM allocation
            float sizeFactor = initialSize;

            // Scale based on memory usage (current usage vs max allocation)
            if (serverData.MaxMemoryInMB > 0)
            {
                float memoryUsageRatio = serverData.MemoryInMB / serverData.MaxMemoryInMB;
                sizeFactor += memoryUsageRatio * 0.5f; // Add up to 50% additional size based on memory usage

                // Update color based on memory usage for more visual feedback
                float memoryUsagePercent = memoryUsageRatio * 100.0f;

                // More memory usage = more red, less = more green
                float redComponent = Mathf.Clamp01(memoryUsagePercent / 100.0f);
                float greenComponent = Mathf.Clamp01((100.0f - memoryUsagePercent) / 100.0f);

                cubeRenderer.material.color = new Color(redComponent, greenComponent, 0.5f, 0.8f);
            }

            // Also scale based on player count
            sizeFactor += (serverData.playerCount * 0.01f);

            // Make sure size doesn't become negative
            sizeFactor = Mathf.Max(0.1f, sizeFactor);

            transform.localScale = Vector3.one * sizeFactor;

            // Add rotation based on CPU usage for additional visual feedback
            float cpuPercentage = serverData.CPUPercentage;
            float rotationSpeedAdjustment = 1.0f + (cpuPercentage / 100.0f); // Higher CPU = faster rotation
            transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime * rotationSpeedAdjustment);
        }

        private Color GetColorForServer(ServerData serverData)
        {
            switch (serverData.status.ToLower())
            {
                case "running":
                    // Use CPU percentage to determine color (green to red)
                    float cpuPercentage = serverData.CPUPercentage;
                    if (cpuPercentage < 50)
                        return Color.green; // Low CPU - green
                    else if (cpuPercentage < 80)
                        return Color.yellow; // Medium CPU - yellow
                    else
                        return Color.red; // High CPU - red
                case "stopped":
                    return stoppedColor;
                case "exited":
                    return exitingColor;
                case "paused":
                    return Color.blue;
                default:
                    return defaultColor;
            }
        }
    }

    public class Server3DVisualization : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager; // Added missing DataManager reference
        public float gridSize = 4f;
        public float animationSpeed = 0.5f;

        [Header("Prefabs")]
        public GameObject serverCubePrefab;

        private Dictionary<string, ServerCube> serverCubes = new Dictionary<string, ServerCube>();
        private Camera mainCamera;

        void Start()
        {
            mainCamera = Camera.main;
            if (dataManager != null)
            {
                dataManager.OnDataUpdated += UpdateVisualization;
            }
        }

        void OnDestroy()
        {
            if (dataManager != null)
            {
                dataManager.OnDataUpdated -= UpdateVisualization;
            }
        }

        public void InitializeVisualization(List<ServerData> servers)
        {
            // Clear existing cubes
            foreach (var cube in serverCubes.Values)
            {
                if (cube != null)
                    DestroyImmediate(cube.gameObject);
            }
            serverCubes.Clear();

            // Calculate grid size based on number of servers
            int gridSize = Mathf.CeilToInt(Mathf.Sqrt(servers.Count));
            
            for (int i = 0; i < servers.Count; i++)
            {
                // Calculate grid position
                int row = Mathf.FloorToInt(i / gridSize);
                int col = i % gridSize;
                
                Vector3 position = new Vector3(
                    (col - (gridSize - 1) / 2f) * gridSize,
                    (row - (gridSize - 1) / 2f) * gridSize,
                    0
                );

                // Create cube
                GameObject cubeObj = Instantiate(serverCubePrefab != null ? serverCubePrefab : CreateDefaultCube(), position, Quaternion.identity);
                ServerCube serverCube = cubeObj.GetComponent<ServerCube>();
                
                if (serverCube == null)
                {
                    serverCube = cubeObj.AddComponent<ServerCube>();
                }
                
                serverCube.serverName = servers[i].server;
                
                // Store reference
                serverCubes[servers[i].server] = serverCube;
                
                // Update visual with initial data
                serverCube.UpdateVisual(servers[i]);
            }
        }

        private GameObject CreateDefaultCube()
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            DestroyImmediate(cube.GetComponent<BoxCollider>()); // Remove collider for better performance
            return cube;
        }

        public void UpdateVisualization()
        {
            if (dataManager == null) return;

            // Update each cube with current server data
            foreach (var serverData in dataManager.servers)
            {
                if (serverCubes.ContainsKey(serverData.server))
                {
                    serverCubes[serverData.server].UpdateVisual(serverData);
                }
            }
        }

        void Update()
        {
            // Gentle camera movement to create visual interest
            if (mainCamera != null)
            {
                float x = Mathf.Sin(Time.time * 0.1f) * 5f;
                float z = Mathf.Cos(Time.time * 0.1f) * 5f;
                
                Vector3 targetPosition = new Vector3(x, mainCamera.transform.position.y, z);
                
                // Smoothly follow the target position
                mainCamera.transform.position = Vector3.Lerp(
                    mainCamera.transform.position, 
                    targetPosition, 
                    Time.deltaTime * animationSpeed
                );
                
                // Look at the center of the visualization
                mainCamera.transform.LookAt(Vector3.zero);
            }
        }
    }
}