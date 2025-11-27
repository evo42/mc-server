using System;
using UnityEngine;

namespace MinecraftAdmin.Models
{
    [Serializable]
    public class ServerData
    {
        public string server;
        public string status;
        public string cpu;
        public string memory;  // Current memory usage
        public string minMemory;  // Minimum allocated memory
        public string maxMemory;  // Maximum allocated memory
        public int playerCount;
        public string motd;
        public int maxPlayers;
        public string version;
        public bool online;
        public string gameMode;
        public string difficulty;
        public string levelName;
        public string levelSeed;
        public string levelType;
        public int viewDistance;
        public bool onlineMode;
        public string containerId;
        public string rawStatus;
        public string[] players;

        public float CPUPercentage
        {
            get
            {
                if (string.IsNullOrEmpty(cpu) || !cpu.Contains("%"))
                    return 0f;

                float value = 0f;
                float.TryParse(cpu.Replace("%", ""), out value);
                return value;
            }
        }

        public float MemoryInMB
        {
            get
            {
                if (string.IsNullOrEmpty(memory) || memory == "N/A")
                    return 0f;

                // Extract numeric value from memory string (e.g., "1234.56MB" -> 1234.56)
                string numericPart = System.Text.RegularExpressions.Regex.Replace(memory, @"[^\d.]", "");
                float value = 0f;
                float.TryParse(numericPart, out value);
                return value;
            }
        }

        public float MinMemoryInMB
        {
            get
            {
                if (string.IsNullOrEmpty(minMemory))
                    return 0f;

                // Extract numeric value from memory string (e.g., "1G" -> 1024, "2048M" -> 2048)
                return ParseMemoryString(minMemory);
            }
        }

        public float MaxMemoryInMB
        {
            get
            {
                if (string.IsNullOrEmpty(maxMemory))
                    return 0f;

                // Extract numeric value from memory string (e.g., "4G" -> 4096, "4096M" -> 4096)
                return ParseMemoryString(maxMemory);
            }
        }

        private float ParseMemoryString(string memoryStr)
        {
            if (string.IsNullOrEmpty(memoryStr))
                return 0f;

            // Extract numeric part and unit
            string numericPart = System.Text.RegularExpressions.Regex.Replace(memoryStr, @"[^\d.]", "");
            string unit = System.Text.RegularExpressions.Regex.Replace(memoryStr, @"[\d.]", "").ToLower();

            float value = 0f;
            float.TryParse(numericPart, out value);

            // Convert to MB based on unit
            switch (unit)
            {
                case "g":
                    return value * 1024; // Convert GB to MB
                case "m":
                    return value; // Already in MB
                case "k":
                    return value / 1024; // Convert KB to MB
                case "b":
                    return value / (1024 * 1024); // Convert bytes to MB
                default:
                    return value; // Assume MB if no unit specified
            }
        }
    }

    [Serializable]
    public class ServerListResponse
    {
        public ServerData[] servers;
    }
}