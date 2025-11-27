# Globaler Style-Properties Fix - Erweiterte Lösung

## Überblick
Da es noch weitere IStyle Property-Fehler in verschiedenen Dateien gibt, erstelle ich eine umfassende Lösung.

## Verbleibende Fehler, die behoben werden müssen:

### 1. ServerConfigurationView.cs (Zeile 76)
- `container.style.padding = 15;` → `container.style.SetPadding(15);`

### 2. ServerListView.cs (Zeile 117)
- `card.style.border = new StyleBorder(new BorderEdge(1));` → `card.style.SetBorder(new StyleBorder(1));`

### 3. ChartManager.cs (Zeilen 183, 252)
- `card.style.borderRadius = 10;` → `card.style.SetBorderRadius(10);`

### 4. UnityMinecraftAdmin.cs (Zeilen 347, 366, 516, 615, 669)
- Verschiedene IStyle Properties korrigieren

### 5. MainSceneController.cs (Zeilen 472, 476, 480)
- textAlign Properties bereits korrekt auf Labels gesetzt

## Sofortige Lösung

Füge zu **jeder** der folgenden Dateien am Anfang die using-Direktive hinzu:
```csharp
using MinecraftAdmin.UI;
```

Dann ersetze die fehlerhaften Properties:

### Style Properties ersetzen:
- `style.padding = X` → `style.SetPadding(X)`
- `style.border = new StyleBorder(...)` → `style.SetBorder(new StyleBorder(...))`
- `style.borderRadius = X` → `style.SetBorderRadius(X)`

## Alternative Quick-Fix

Falls eine vollständige Korrektur zu zeitaufwändig ist, kann ein bedingter Compilation-Fix verwendet werden:

```csharp
#if UNITY_EDITOR
// Temporary workaround for missing UIElements properties
public static class UIElementsCompatibility {
    public static void SetPadding(this IStyle style, float value) {
        style.paddingTop = new StyleLength(new Length(value, LengthUnit.Pixel));
        style.paddingRight = new StyleLength(new Length(value, LengthUnit.Pixel));
        style.paddingBottom = new StyleLength(new Length(value, LengthUnit.Pixel));
        style.paddingLeft = new StyleLength(new Length(value, LengthUnit.Pixel));
    }
}
#endif
```

## Status:
- ✅ Grundlegende IStyle-Fixes implementiert
- ⚠️ Verbleibende UI-Dateien benötigen gleiche Korrekturen
- 🎯 **Empfehlung**: Diese globalen Fixes auf alle betroffenen Dateien anwenden

Das Projekt sollte nach diesen Änderungen kompilieren!