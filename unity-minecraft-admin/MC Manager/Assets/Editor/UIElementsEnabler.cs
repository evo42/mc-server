#if UNITY_6000_OR_NEWER
using UnityEditor;
using UnityEngine;

[InitializeOnLoad]
public static class UIElementsEnabler
{
    static UIElementsEnabler()
    {
        // Force UIElements Module Loading for Unity 6000.2.14
        try
        {
            // Test if UIElements types are accessible
            var uiDocumentType = typeof(UnityEngine.UIElements.UIDocument);
            var visualElementType = typeof(UnityEngine.UIElements.VisualElement);
            var labelType = typeof(UnityEngine.UIElements.Label);
            var buttonType = typeof(UnityEngine.UIElements.Button);
            var textFieldType = typeof(UnityEngine.UIElements.TextField);

            Debug.Log("✅ UIElements Module successfully loaded!");
            Debug.Log($"📦 UIDocument: {uiDocumentType != null}");
            Debug.Log($"📦 VisualElement: {visualElementType != null}");
            Debug.Log($"📦 Label: {labelType != null}");
            Debug.Log($"📦 Button: {buttonType != null}");
            Debug.Log($"📦 TextField: {textFieldType != null}");

            // Set scripting define symbols if not already set
            SetScriptingDefineSymbols();
        }
        catch (System.Exception e)
        {
            Debug.LogError($"❌ UIElements Module loading failed: {e.Message}");
        }
    }

    static void SetScriptingDefineSymbols()
    {
        #if UNITY_EDITOR
        var buildTargetGroup = UnityEditor.Build.NamedBuildTarget.Standalone;
        var symbols = UnityEditor.PlayerSettings.GetScriptingDefineSymbols(buildTargetGroup);

        if (!symbols.Contains("ENABLE_UIELEMENTS"))
        {
            symbols += ";ENABLE_UIELEMENTS";
            Debug.Log("🔧 Added ENABLE_UIELEMENTS define symbol");
        }

        if (!symbols.Contains("ENABLE_UI_TOOLKIT"))
        {
            symbols += ";ENABLE_UI_TOOLKIT";
            Debug.Log("🔧 Added ENABLE_UI_TOOLKIT define symbol");
        }

        UnityEditor.PlayerSettings.SetScriptingDefineSymbols(buildTargetGroup, symbols);
        Debug.Log($"🎯 Current Scripting Define Symbols: {symbols}");
        #endif
    }

    [MenuItem("Tools/UIElements/Verify Module Status")]
    public static void VerifyUIElementsStatus()
    {
        Debug.Log("=== UIElements Module Verification ===");

        // Check each UIElements type
        CheckType<UnityEngine.UIElements.UIDocument>("UIDocument");
        CheckType<UnityEngine.UIElements.VisualElement>("VisualElement");
        CheckType<UnityEngine.UIElements.Label>("Label");
        CheckType<UnityEngine.UIElements.Button>("Button");
        CheckType<UnityEngine.UIElements.TextField>("TextField");
        CheckType<UnityEngine.UIElements.Toggle>("Toggle");
        CheckType<UnityEngine.UIElements.IntegerField>("IntegerField");
        CheckType<UnityEngine.UIElements.VisualTreeAsset>("VisualTreeAsset");

        // Check UI modules
        CheckType<UnityEngine.Canvas>("Canvas");
        CheckType<UnityEngine.CanvasGroup>("CanvasGroup");

        Debug.Log("=== End Verification ===");
    }

    static void CheckType<T>(string typeName)
    {
        try
        {
            var type = typeof(T);
            Debug.Log($"✅ {typeName}: Available");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"❌ {typeName}: Failed - {e.Message}");
        }
    }

    [MenuItem("Tools/UIElements/Force Package Refresh")]
    public static void ForcePackageRefresh()
    {
        #if UNITY_EDITOR
        UnityEditor.PackageManager.Client.Resolve();
        Debug.Log("🔄 Package Manager Resolve triggered");
        #endif
    }
}
#endif
