using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace MinecraftAdmin.Build
{
    public static class BuildScript
    {
        private static readonly string[] Scenes = {
            "Assets/Scenes/MainScene.unity"
        };

        [MenuItem("Tools/Minecraft Admin/Build All Platforms")]
        public static void BuildAll()
        {
            BuildWindows();
            BuildMac();
            BuildLinux();
            Debug.Log("All builds completed!");
        }

        [MenuItem("Tools/Minecraft Admin/Build Windows")]
        public static void BuildWindows()
        {
            var buildPath = Path.Combine(Application.dataPath, "../Builds/Windows");
            BuildPipeline.BuildPlayer(Scenes, buildPath, BuildTarget.StandaloneWindows64, BuildOptions.None);
            Debug.Log($"Windows build completed at: {buildPath}");
        }

        [MenuItem("Tools/Minecraft Admin/Build Mac")]
        public static void BuildMac()
        {
            var buildPath = Path.Combine(Application.dataPath, "../Builds/Mac");
            BuildPipeline.BuildPlayer(Scenes, buildPath, BuildTarget.StandaloneOSX, BuildOptions.None);
            Debug.Log($"Mac build completed at: {buildPath}");
        }

        [MenuItem("Tools/Minecraft Admin/Build Linux")]
        public static void BuildLinux()
        {
            var buildPath = Path.Combine(Application.dataPath, "../Builds/Linux");
            BuildPipeline.BuildPlayer(Scenes, buildPath, BuildTarget.StandaloneLinux64, BuildOptions.None);
            Debug.Log($"Linux build completed at: {buildPath}");
        }
    }
}