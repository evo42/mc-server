using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using MinecraftAdmin.Models;

namespace MinecraftAdmin.API
{
    public class APIManager : MonoBehaviour
    {
        [Header("Configuration")]
        public string apiBaseURL = "http://localhost:3000/api";
        public string username = "admin";
        public string password = "admin123";

        // Events
        public Action<ServerData[]> OnServerStatusReceived;
        public Action<string> OnError;
        public Action<bool> OnAuthenticationChanged;

        private string authToken;
        private bool isAuthenticated = false;

        // Start is called automatically
        private void Start()
        {
            // Attempt to authenticate at startup
            Authenticate();
        }

        public void Authenticate()
        {
            StartCoroutine(AuthenticateCoroutine());
        }

        private IEnumerator AuthenticateCoroutine()
        {
            // Basic authentication header
            string credentials = System.Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
            authToken = $"Basic {credentials}";

            // Test the authentication with a simple status request
            using (UnityWebRequest request = UnityWebRequest.Get($"{apiBaseURL}/servers/status"))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Authentication failed: {request.error}");
                    isAuthenticated = false;
                    OnAuthenticationChanged?.Invoke(false);
                    OnError?.Invoke(request.error);
                }
                else
                {
                    isAuthenticated = true;
                    OnAuthenticationChanged?.Invoke(true);
                    Debug.Log("Authentication successful");
                }
            }
        }

        public void GetServerStatus()
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(GetServerStatusCoroutine());
        }

        private IEnumerator GetServerStatusCoroutine()
        {
            using (UnityWebRequest request = UnityWebRequest.Get($"{apiBaseURL}/servers/status"))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error getting server status: {request.error}");
                    OnError?.Invoke(request.error);
                }
                else
                {
                    // Parse the JSON response
                    string jsonResponse = request.downloadHandler.text;
                    Debug.Log($"Server status response: {jsonResponse}");

                    // The API returns a JSON object where keys are server names and values are server objects
                    // We need to convert this to an array
                    // Since JsonUtility doesn't handle dictionaries, we'll use a custom serializer
                    var serverDict = MinecraftAdmin.Utils.JSON.Parse(jsonResponse);
                    var serverList = new List<ServerData>();

                    if (serverDict is MinecraftAdmin.Utils.JSONObject jsonObj)
                    {
                        // Get the keys using a different approach
                        var keys = jsonObj.Keys.Select(kvp => kvp.Key).ToList();
                        foreach (string key in keys)
                        {
                            var serverJson = jsonObj[key].ToString();
                            // We need to add the server name to the JSON object since it's the key
                            var modifiedJson = "{ \"server\": \"" + key + "\", " + serverJson.Substring(1); // Add server name and remove leading '{'
                            var serverData = JsonUtility.FromJson<ServerData>(modifiedJson);
                            serverList.Add(serverData);
                        }
                    }

                    OnServerStatusReceived?.Invoke(serverList.ToArray());
                }
            }
        }

        public void StartServer(string serverName)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(StartServerCoroutine(serverName));
        }

        private IEnumerator StartServerCoroutine(string serverName)
        {
            var formData = new List<IMultipartFormSection>();
            var boundary = UnityWebRequest.GenerateBoundary();
            var form = new List<IMultipartFormSection>();

            using (UnityWebRequest request = UnityWebRequest.Post($"{apiBaseURL}/servers/start/{serverName}", form, boundary))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error starting server {serverName}: {request.error}");
                    OnError?.Invoke($"Error starting server {serverName}: {request.error}");
                }
                else
                {
                    Debug.Log($"Server {serverName} started successfully");
                    // Refresh the status after a short delay
                    yield return new WaitForSeconds(1f);
                    GetServerStatus();
                }
            }
        }

        public void StopServer(string serverName)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(StopServerCoroutine(serverName));
        }

        private IEnumerator StopServerCoroutine(string serverName)
        {
            var formData = new List<IMultipartFormSection>();
            var boundary = UnityWebRequest.GenerateBoundary();
            var form = new List<IMultipartFormSection>();

            using (UnityWebRequest request = UnityWebRequest.Post($"{apiBaseURL}/servers/stop/{serverName}", form, boundary))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error stopping server {serverName}: {request.error}");
                    OnError?.Invoke($"Error stopping server {serverName}: {request.error}");
                }
                else
                {
                    Debug.Log($"Server {serverName} stopped successfully");
                    // Refresh the status after a short delay
                    yield return new WaitForSeconds(1f);
                    GetServerStatus();
                }
            }
        }

        public void RestartServer(string serverName)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(RestartServerCoroutine(serverName));
        }

        private IEnumerator RestartServerCoroutine(string serverName)
        {
            var formData = new List<IMultipartFormSection>();
            var boundary = UnityWebRequest.GenerateBoundary();
            var form = new List<IMultipartFormSection>();

            using (UnityWebRequest request = UnityWebRequest.Post($"{apiBaseURL}/servers/restart/{serverName}", form, boundary))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error restarting server {serverName}: {request.error}");
                    OnError?.Invoke($"Error restarting server {serverName}: {request.error}");
                }
                else
                {
                    Debug.Log($"Server {serverName} restarted successfully");
                    // Refresh the status after a short delay
                    yield return new WaitForSeconds(1f);
                    GetServerStatus();
                }
            }
        }

        public void GetDatapacksForServer(string serverName)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(GetDatapacksForServerCoroutine(serverName));
        }

        private IEnumerator GetDatapacksForServerCoroutine(string serverName)
        {
            using (UnityWebRequest request = UnityWebRequest.Get($"{apiBaseURL}/datapacks/{serverName}"))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error getting datapacks for {serverName}: {request.error}");
                    OnError?.Invoke($"Error getting datapacks for {serverName}: {request.error}");
                }
                else
                {
                    Debug.Log($"Datapacks for {serverName} retrieved successfully");
                    // Parse and return the datapacks
                    // This would require creating a DatapackResponse class
                    // For now, we'll just return the raw response text
                }
            }
        }

        // Get server configuration
        public void GetServerConfig(string serverName)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(GetServerConfigCoroutine(serverName));
        }

        private IEnumerator GetServerConfigCoroutine(string serverName)
        {
            using (UnityWebRequest request = UnityWebRequest.Get($"{apiBaseURL}/servers/config/{serverName}"))
            {
                request.SetRequestHeader("Authorization", authToken);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error getting config for {serverName}: {request.error}");
                    OnError?.Invoke($"Error getting config for {serverName}: {request.error}");
                }
                else
                {
                    // Parse the JSON response
                    var serverConfig = JsonUtility.FromJson<ServerConfig>(request.downloadHandler.text);
                    OnServerConfigReceived?.Invoke(serverName, serverConfig);
                }
            }
        }

        // Update server configuration
        public void UpdateServerConfig(string serverName, ServerConfig config)
        {
            if (!isAuthenticated)
            {
                OnError?.Invoke("Not authenticated");
                return;
            }

            StartCoroutine(UpdateServerConfigCoroutine(serverName, config));
        }

        private IEnumerator UpdateServerConfigCoroutine(string serverName, ServerConfig config)
        {
            string jsonData = JsonUtility.ToJson(config);

            using (UnityWebRequest request = new UnityWebRequest($"{apiBaseURL}/servers/config/{serverName}", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Authorization", authToken);
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"Error updating config for {serverName}: {request.error}");
                    OnError?.Invoke($"Error updating config for {serverName}: {request.error}");
                }
                else
                {
                    Debug.Log($"Config for {serverName} updated successfully");
                    Debug.Log($"RAM Settings - Min: {config.minMemory}, Max: {config.maxMemory}");

                    // Optionally get the updated server status after config change
                    yield return new WaitForSeconds(1f);
                    GetServerStatus();

                    // After updating the configuration, we should also check if the RAM settings changed
                    // and potentially update the visualization to reflect the new RAM limits
                    if (OnServerConfigUpdated != null)
                    {
                        OnServerConfigUpdated(serverName, config);
                    }
                }
            }
        }

        // Events for server configuration
        public Action<string, ServerConfig> OnServerConfigReceived;
        public Action<string, ServerConfig> OnServerConfigUpdated;

        // Helper class to parse server data from JSON
        [Serializable]
        private class ServerDataDictionaryWrapper
        {
            public Dictionary<string, ServerData> servers;
        }
    }
}