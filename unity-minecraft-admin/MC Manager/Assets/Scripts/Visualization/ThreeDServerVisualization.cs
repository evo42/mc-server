using System.Collections.Generic;
using UnityEngine;
using MinecraftAdmin.Models;
using MinecraftAdmin.Data;

namespace MinecraftAdmin.Visualization
{
    [RequireComponent(typeof(Camera))]
    public class ThreeDServerVisualization : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager; // Added missing DataManager reference
        public float gridSize = 4f;
        public float rotationSpeed = 0.5f;
        public float pulseSpeed = 2f;
        public float pulseAmount = 0.1f;

        [Header("Materials")]
        public Material defaultMaterial;
        public Material runningMaterial;
        public Material stoppedMaterial;
        public Material exitedMaterial;
        
        [Header("Prefabs")]
        public GameObject serverCubePrefab;

        private List<ServerCube> serverCubes = new List<ServerCube>();
        private Camera mainCamera;
        private bool isInitialized = false;

        void Start()
        {
            mainCamera = GetComponent<Camera>();
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }
            
            if (dataManager != null)
            {
                dataManager.OnDataUpdated += UpdateVisualization;
            }
            
            InitializeVisualization();
        }

        void OnDestroy()
        {
            if (dataManager != null)
            {
                dataManager.OnDataUpdated -= UpdateVisualization;
            }
            
            // Clean up created cubes
            foreach (var cube in serverCubes)
            {
                if (cube != null)
                    Destroy(cube.gameObject);
            }
            serverCubes.Clear();
        }

        public void InitializeVisualization()
        {
            if (dataManager == null || dataManager.servers.Count == 0) return;
            
            // Clear existing cubes
            foreach (var cube in serverCubes)
            {
                if (cube != null)
                    DestroyImmediate(cube.gameObject);
            }
            serverCubes.Clear();

            // Calculate grid size based on number of servers
            int serverCount = dataManager.servers.Count;
            int gridSize = Mathf.CeilToInt(Mathf.Sqrt(serverCount));
            
            for (int i = 0; i < serverCount; i++)
            {
                var serverData = dataManager.servers[i];
                
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
                
                serverCube.serverName = serverData.server;
                serverCube.rotationSpeed = rotationSpeed;
                serverCube.pulseSpeed = pulseSpeed;
                serverCube.pulseAmount = pulseAmount;
                
                // Store reference
                serverCubes.Add(serverCube);
                
                // Update visual with current data
                serverCube.UpdateVisual(serverData);
            }
            
            isInitialized = true;
        }

        private GameObject CreateDefaultCube()
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            // Remove collider for better performance
            DestroyImmediate(cube.GetComponent<BoxCollider>());
            return cube;
        }

        public void UpdateVisualization()
        {
            if (dataManager == null || !isInitialized) return;

            // Make sure we have the right number of cubes
            if (serverCubes.Count != dataManager.servers.Count)
            {
                InitializeVisualization();
                return;
            }

            // Update each cube with current server data
            for (int i = 0; i < serverCubes.Count && i < dataManager.servers.Count; i++)
            {
                serverCubes[i].UpdateVisual(dataManager.servers[i]);
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
                    Time.deltaTime * 0.2f
                );
                
                // Look at the center of the visualization
                mainCamera.transform.LookAt(Vector3.zero);
            }
        }
    }
}