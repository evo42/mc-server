using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.Data;
using MinecraftAdmin.API;
using MinecraftAdmin.Models;
using MinecraftAdmin.Managers;

namespace MinecraftAdmin.UI
{
    public class ServerConfigurationView : MonoBehaviour
    {
        [Header("Configuration")]
        public DataManager dataManager;
        public APIManager apiManager;

        [Header("UI Elements")]
        public UIDocument uiDocument;

        private VisualElement root;
        private string currentServer;
        private ServerConfig currentConfig;

        private TextField minMemoryField;
        private TextField maxMemoryField;
        private TextField motdField;
        private Toggle onlineModeToggle;
        private IntegerField maxPlayersField;
        private IntegerField viewDistanceField;
        private TextField levelNameField;
        private TextField levelSeedField;
        private TextField levelTypeField;
        private TextField gameModeField;
        private TextField difficultyField;

        private Button saveButton;
        private Button cancelButton;

        private Label titleLabel;

        private void OnEnable()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }

            if (apiManager != null)
            {
                apiManager.OnServerConfigReceived += OnServerConfigReceived;
                apiManager.OnError += OnAPIError;
            }
        }

        private void OnDisable()
        {
            if (apiManager != null)
            {
                apiManager.OnServerConfigReceived -= OnServerConfigReceived;
                apiManager.OnError -= OnAPIError;
            }
        }

        public void InitializeConfigurationView(string serverName)
        {
            currentServer = serverName;

            if (root == null) return;

            // Clear existing content
            root.Clear();

            // Create configuration layout
            var configContainer = new VisualElement();
            configContainer.style.flexDirection = FlexDirection.Column;
            configContainer.style.SetPadding(20);

            // Header
            var headerContainer = new VisualElement();
            headerContainer.style.flexDirection = FlexDirection.Row;
            headerContainer.style.justifyContent = Justify.SpaceBetween;
            headerContainer.style.alignItems = Align.Center;
            headerContainer.style.marginBottom = 20;

            titleLabel = new Label($"Configure Server: {GetServerDisplayName(serverName)}");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

            var backButton = new Button(() => {
                // Navigate back to the server list or dashboard
                StateManager.Instance.ChangeState(ApplicationState.ServerList);
            });
            backButton.text = "Back";

            headerContainer.Add(titleLabel);
            headerContainer.Add(backButton);

            configContainer.Add(headerContainer);

            // Create configuration form
            var formContainer = new VisualElement();
            formContainer.style.flexDirection = FlexDirection.Column;

            // RAM Configuration (Min/Max Memory)
            var ramSection = CreateRAMConfigSection();
            formContainer.Add(ramSection);

            // Basic Settings
            var basicSection = CreateBasicSettingsSection();
            formContainer.Add(basicSection);

            // World Settings
            var worldSection = CreateWorldSettingsSection();
            formContainer.Add(worldSection);

            // Game Settings
            var gameSection = CreateGameSettingsSection();
            formContainer.Add(gameSection);

            // Buttons
            var buttonContainer = new VisualElement();
            buttonContainer.style.flexDirection = FlexDirection.Row;
            buttonContainer.style.justifyContent = Justify.FlexEnd;
            buttonContainer.style.marginTop = 20;

            saveButton = new Button(SaveConfiguration);
            saveButton.text = "Save Configuration";
            saveButton.style.marginRight = 10;
            saveButton.AddToClassList("btn");
            saveButton.AddToClassList("btn-primary");

            cancelButton = new Button(() => {
                StateManager.Instance.ChangeState(ApplicationState.ServerList);
            });
            cancelButton.text = "Cancel";
            cancelButton.AddToClassList("btn");
            cancelButton.AddToClassList("btn-secondary");

            buttonContainer.Add(saveButton);
            buttonContainer.Add(cancelButton);

            // Add form and buttons to container
            configContainer.Add(formContainer);
            configContainer.Add(buttonContainer);

            root.Add(configContainer);

            // Load current configuration
            LoadCurrentConfiguration();
        }

        private VisualElement CreateRAMConfigSection()
        {
            var section = new VisualElement();
            section.style.flexDirection = FlexDirection.Column;
            section.style.marginBottom = 20;

            var sectionHeader = new Label("RAM Configuration");
            sectionHeader.style.fontSize = 18;
            sectionHeader.style.unityFontStyleAndWeight = FontStyle.Bold;
            sectionHeader.style.marginBottom = 10;

            // RAM allocation fields
            var ramFieldsContainer = new VisualElement();
            ramFieldsContainer.style.flexDirection = FlexDirection.Row;
            ramFieldsContainer.style.flexWrap = Wrap.Wrap;

            // Min Memory
            var minMemoryContainer = new VisualElement();
            minMemoryContainer.style.flexDirection = FlexDirection.Column;
            minMemoryContainer.style.marginRight = 20;
            minMemoryContainer.style.flexBasis = new Length(30, LengthUnit.Percent);

            var minMemoryLabel = new Label("Minimum Memory (e.g., 1G, 1024M):");
            minMemoryField = new TextField();
            minMemoryField.value = "1G";

            minMemoryContainer.Add(minMemoryLabel);
            minMemoryContainer.Add(minMemoryField);

            // Max Memory
            var maxMemoryContainer = new VisualElement();
            maxMemoryContainer.style.flexDirection = FlexDirection.Column;
            maxMemoryContainer.style.flexBasis = new Length(30, LengthUnit.Percent);

            var maxMemoryLabel = new Label("Maximum Memory (e.g., 4G, 4096M):");
            maxMemoryField = new TextField();
            maxMemoryField.value = "4G";

            maxMemoryContainer.Add(maxMemoryLabel);
            maxMemoryContainer.Add(maxMemoryField);

            ramFieldsContainer.Add(minMemoryContainer);
            ramFieldsContainer.Add(maxMemoryContainer);

            section.Add(sectionHeader);
            section.Add(ramFieldsContainer);

            return section;
        }

        private VisualElement CreateBasicSettingsSection()
        {
            var section = new VisualElement();
            section.style.flexDirection = FlexDirection.Column;
            section.style.marginBottom = 20;

            var sectionHeader = new Label("Basic Settings");
            sectionHeader.style.fontSize = 18;
            sectionHeader.style.unityFontStyleAndWeight = FontStyle.Bold;
            sectionHeader.style.marginBottom = 10;

            // Basic settings container
            var basicFieldsContainer = new VisualElement();
            basicFieldsContainer.style.flexDirection = FlexDirection.Column;

            // MOTD
            var motdContainer = new VisualElement();
            motdContainer.style.flexDirection = FlexDirection.Column;
            motdContainer.style.marginBottom = 10;

            var motdLabel = new Label("Message of the Day (MOTD):");
            motdField = new TextField();
            motdField.value = "Welcome to the server!";

            motdContainer.Add(motdLabel);
            motdContainer.Add(motdField);

            // Online mode and max players
            var onlineMaxContainer = new VisualElement();
            onlineMaxContainer.style.flexDirection = FlexDirection.Row;
            onlineMaxContainer.style.flexWrap = Wrap.Wrap;

            var onlineModeContainer = new VisualElement();
            onlineModeContainer.style.flexDirection = FlexDirection.Column;
            onlineModeContainer.style.marginRight = 20;
            onlineModeContainer.style.flexBasis = new Length(30, LengthUnit.Percent);

            var onlineModeLabel = new Label("Online Mode:");
            onlineModeToggle = new Toggle();
            onlineModeToggle.value = true;

            onlineModeContainer.Add(onlineModeLabel);
            onlineModeContainer.Add(onlineModeToggle);

            // Max Players
            var maxPlayersContainer = new VisualElement();
            maxPlayersContainer.style.flexDirection = FlexDirection.Column;
            maxPlayersContainer.style.flexBasis = new Length(30, LengthUnit.Percent);

            var maxPlayersLabel = new Label("Max Players:");
            maxPlayersField = new IntegerField();
            maxPlayersField.value = 20;

            maxPlayersContainer.Add(maxPlayersLabel);
            maxPlayersContainer.Add(maxPlayersField);

            onlineMaxContainer.Add(onlineModeContainer);
            onlineMaxContainer.Add(maxPlayersContainer);

            // View Distance
            var viewDistanceContainer = new VisualElement();
            viewDistanceContainer.style.flexDirection = FlexDirection.Column;
            viewDistanceContainer.style.marginTop = 10;

            var viewDistanceLabel = new Label("View Distance:");
            viewDistanceField = new IntegerField();
            viewDistanceField.value = 10;

            viewDistanceContainer.Add(viewDistanceLabel);
            viewDistanceContainer.Add(viewDistanceField);

            basicFieldsContainer.Add(motdContainer);
            basicFieldsContainer.Add(onlineMaxContainer);
            basicFieldsContainer.Add(viewDistanceContainer);

            section.Add(sectionHeader);
            section.Add(basicFieldsContainer);

            return section;
        }

        private VisualElement CreateWorldSettingsSection()
        {
            var section = new VisualElement();
            section.style.flexDirection = FlexDirection.Column;
            section.style.marginBottom = 20;

            var sectionHeader = new Label("World Settings");
            sectionHeader.style.fontSize = 18;
            sectionHeader.style.unityFontStyleAndWeight = FontStyle.Bold;
            sectionHeader.style.marginBottom = 10;

            // World settings container
            var worldFieldsContainer = new VisualElement();
            worldFieldsContainer.style.flexDirection = FlexDirection.Column;

            // Level name
            var levelNameContainer = new VisualElement();
            levelNameContainer.style.flexDirection = FlexDirection.Column;
            levelNameContainer.style.marginBottom = 10;

            var levelNameLabel = new Label("Level Name:");
            levelNameField = new TextField();
            levelNameField.value = "world";

            levelNameContainer.Add(levelNameLabel);
            levelNameContainer.Add(levelNameField);

            // Level seed
            var levelSeedContainer = new VisualElement();
            levelSeedContainer.style.flexDirection = FlexDirection.Column;
            levelSeedContainer.style.marginBottom = 10;

            var levelSeedLabel = new Label("Level Seed (optional):");
            levelSeedField = new TextField();
            levelSeedField.value = "";

            levelSeedContainer.Add(levelSeedLabel);
            levelSeedContainer.Add(levelSeedField);

            // Level type
            var levelTypeContainer = new VisualElement();
            levelTypeContainer.style.flexDirection = FlexDirection.Column;

            var levelTypeLabel = new Label("Level Type:");
            levelTypeField = new TextField();
            levelTypeField.value = "DEFAULT";

            levelTypeContainer.Add(levelTypeLabel);
            levelTypeContainer.Add(levelTypeField);

            worldFieldsContainer.Add(levelNameContainer);
            worldFieldsContainer.Add(levelSeedContainer);
            worldFieldsContainer.Add(levelTypeContainer);

            section.Add(sectionHeader);
            section.Add(worldFieldsContainer);

            return section;
        }

        private VisualElement CreateGameSettingsSection()
        {
            var section = new VisualElement();
            section.style.flexDirection = FlexDirection.Column;
            section.style.marginBottom = 20;

            var sectionHeader = new Label("Game Settings");
            sectionHeader.style.fontSize = 18;
            sectionHeader.style.unityFontStyleAndWeight = FontStyle.Bold;
            sectionHeader.style.marginBottom = 10;

            // Game settings container
            var gameFieldsContainer = new VisualElement();
            gameFieldsContainer.style.flexDirection = FlexDirection.Column;

            // Game mode
            var gameModeContainer = new VisualElement();
            gameModeContainer.style.flexDirection = FlexDirection.Column;
            gameModeContainer.style.marginBottom = 10;

            var gameModeLabel = new Label("Game Mode:");
            gameModeField = new TextField();
            gameModeField.value = "survival";

            gameModeContainer.Add(gameModeLabel);
            gameModeContainer.Add(gameModeField);

            // Difficulty
            var difficultyContainer = new VisualElement();
            difficultyContainer.style.flexDirection = FlexDirection.Column;

            var difficultyLabel = new Label("Difficulty:");
            difficultyField = new TextField();
            difficultyField.value = "normal";

            difficultyContainer.Add(difficultyLabel);
            difficultyContainer.Add(difficultyField);

            gameFieldsContainer.Add(gameModeContainer);
            gameFieldsContainer.Add(difficultyContainer);

            section.Add(sectionHeader);
            section.Add(gameFieldsContainer);

            return section;
        }

        private void LoadCurrentConfiguration()
        {
            if (string.IsNullOrEmpty(currentServer) || apiManager == null) return;

            // Get the current configuration
            apiManager.GetServerConfig(currentServer);
        }

        private void OnServerConfigReceived(string serverName, ServerConfig config)
        {
            if (serverName != currentServer) return;

            currentConfig = config;

            // Update UI fields with received config
            minMemoryField.value = config.minMemory;
            maxMemoryField.value = config.maxMemory;
            motdField.value = config.motd;
            onlineModeToggle.value = config.onlineMode;
            maxPlayersField.value = config.maxPlayers;
            viewDistanceField.value = config.viewDistance;
            levelNameField.value = config.levelName;
            levelSeedField.value = config.levelSeed;
            levelTypeField.value = config.levelType;
            gameModeField.value = config.gameMode;
            difficultyField.value = config.difficulty;
        }

        private void SaveConfiguration()
        {
            if (currentConfig == null)
            {
                // Create a new config if none exists
                currentConfig = new ServerConfig();
            }

            // Validate RAM values before saving
            if (!ValidateMemoryValues(minMemoryField.value, maxMemoryField.value))
            {
                if (NotificationManager.Instance != null)
                {
                    NotificationManager.Instance.ShowNotification(
                        "Invalid RAM configuration. Maximum memory must be greater than or equal to minimum memory.",
                        NotificationType.Error
                    );
                }
                return;
            }

            // Update config with current UI values
            currentConfig.minMemory = minMemoryField.value;
            currentConfig.maxMemory = maxMemoryField.value;
            currentConfig.motd = motdField.value;
            currentConfig.onlineMode = onlineModeToggle.value;
            currentConfig.maxPlayers = maxPlayersField.value;
            currentConfig.viewDistance = viewDistanceField.value;
            currentConfig.levelName = levelNameField.value;
            currentConfig.levelSeed = levelSeedField.value;
            currentConfig.levelType = levelTypeField.value;
            currentConfig.gameMode = gameModeField.value;
            currentConfig.difficulty = difficultyField.value;

            // Disable save button during save operation
            saveButton.SetEnabled(false);
            saveButton.text = "Saving...";

            // Call API to save the configuration
            if (apiManager != null)
            {
                apiManager.UpdateServerConfig(currentServer, currentConfig);

                // Update local data manager with new RAM values
                var serverInManager = dataManager.GetServerById(currentServer);
                if (serverInManager != null)
                {
                    serverInManager.minMemory = minMemoryField.value;
                    serverInManager.maxMemory = maxMemoryField.value;

                    // Refresh the data to update dependent calculations
                    dataManager.UpdateServerData(dataManager.servers);
                }
            }
        }

        // Validate memory values to ensure min is not greater than max
        private bool ValidateMemoryValues(string minMemory, string maxMemory)
        {
            // Extract numeric values for comparison
            float minMB = ParseMemoryString(minMemory);
            float maxMB = ParseMemoryString(maxMemory);

            return minMB <= maxMB;
        }

        // Helper method to parse memory string to MB value
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

        private void OnAPIError(string error)
        {
            Debug.LogError($"API Error: {error}");

            // Re-enable save button
            if (saveButton != null)
            {
                saveButton.SetEnabled(true);
                saveButton.text = "Save Configuration";
            }

            // Show error notification
            if (NotificationManager.Instance != null)
            {
                NotificationManager.Instance.ShowNotification($"Error saving configuration: {error}", NotificationType.Error);
            }
        }

        private string GetServerDisplayName(string serverName)
        {
            // Map server names to display names similar to the Vue.js version
            switch (serverName)
            {
                case "mc-ilias": return "Ikaria Games";
                case "mc-niilo": return "KDLK.net";
                case "mc-bgstpoelten": return "BG St. Pölten Server";
                case "mc-htlstp": return "HTL St. Pölten Server";
                case "mc-borgstpoelten": return "BORG St. Pölten Server";
                case "mc-hakstpoelten": return "HAK St. Pölten Server";
                case "mc-basop-bafep-stp": return "BASOP BAFEP St. Pölten Server";
                case "mc-play": return "Play Server";
                default: return serverName;
            }
        }
    }
}