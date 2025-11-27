using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.API;
using MinecraftAdmin.Managers;
using MinecraftAdmin.Data;
using System.Collections.Generic;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.Core
{
    public class APITest : MonoBehaviour
    {
        [Header("References")]
        public APIManager apiManager;
        public DataManager dataManager;
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
            
            // Subscribe to API events for testing
            if (apiManager != null)
            {
                apiManager.OnServerStatusReceived += OnServerStatusReceived;
                apiManager.OnError += OnAPIError;
            }
        }
        
        private void OnDestroy()
        {
            if (apiManager != null)
            {
                apiManager.OnServerStatusReceived -= OnServerStatusReceived;
                apiManager.OnError -= OnAPIError;
            }
        }
        
        private void SetupTestUI()
        {
            root.style.flexDirection = FlexDirection.Column;
            root.style.alignItems = Align.Center;
            root.style.justifyContent = Justify.Center;
            root.style.height = new Length(100, LengthUnit.Percent);
            
            // Title
            var title = new Label("API Test Interface");
            title.style.fontSize = 24;
            title.style.unityFontStyleAndWeight = FontStyle.Bold;
            title.style.marginBottom = 20;
            
            // Status label
            statusLabel = new Label("Ready to test API");
            statusLabel.style.fontSize = 16;
            statusLabel.style.marginBottom = 20;
            statusLabel.style.whiteSpace = WhiteSpace.Normal;
            statusLabel.style.width = 400;
            
            // Test button
            testButton = new Button(TestAPI);
            testButton.text = "Test API Connection";
            testButton.style.width = 200;
            testButton.style.marginBottom = 10;
            
            // Manual auth button
            var authButton = new Button(() => {
                if (apiManager != null)
                {
                    apiManager.Authenticate();
                }
            });
            authButton.text = "Authenticate";
            authButton.style.width = 200;
            authButton.style.marginBottom = 10;
            
            // Return to app button
            var returnButton = new Button(() => {
                // In a real app, we would return to the main scene
                statusLabel.text = "Returning to main app...";
            });
            returnButton.text = "Return to Main App";
            returnButton.style.width = 200;
            
            root.Add(title);
            root.Add(statusLabel);
            root.Add(testButton);
            root.Add(authButton);
            root.Add(returnButton);
        }
        
        private void TestAPI()
        {
            if (apiManager == null)
            {
                statusLabel.text = "API Manager not assigned!";
                return;
            }
            
            statusLabel.text = "Testing API connection...";
            testButton.SetEnabled(false);
            
            // Try to get server status
            apiManager.GetServerStatus();
        }
        
        private void OnServerStatusReceived(ServerData[] servers)
        {
            testButton.SetEnabled(true);
            
            if (servers != null && servers.Length > 0)
            {
                statusLabel.text = $"SUCCESS: Received data for {servers.Length} servers\n\n";
                
                // Display server information
                foreach (var server in servers)
                {
                    statusLabel.text += $"Server: {server.server}, Status: {server.status}, CPU: {server.cpu}, Players: {server.playerCount}\n";
                }
                
                // Update data manager with received data
                if (dataManager != null)
                {
                    var serverList = new List<ServerData>();
                    foreach (var server in servers)
                    {
                        serverList.Add(server);
                    }
                    dataManager.UpdateServerData(serverList);
                }
            }
            else
            {
                statusLabel.text = "SUCCESS: API responded but no servers returned";
            }
        }
        
        private void OnAPIError(string error)
        {
            testButton.SetEnabled(true);
            statusLabel.text = $"ERROR: {error}";
        }
    }
}