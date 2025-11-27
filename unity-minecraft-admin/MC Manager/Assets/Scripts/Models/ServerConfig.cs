using System;

namespace MinecraftAdmin.Models
{
    [Serializable]
    public class ServerConfig
    {
        public string minMemory = "1G";
        public string maxMemory = "4G";
        public string motd = "Welcome to the server!";
        public bool onlineMode = true;
        public int maxPlayers = 20;
        public int viewDistance = 10;
        public string levelName = "world";
        public string levelSeed = "";
        public string levelType = "DEFAULT";
        public string gameMode = "survival";
        public string difficulty = "normal";
    }
}