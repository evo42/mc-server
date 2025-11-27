# Unity Minecraft Server Admin Panel - Setup Instructions

## Project Overview
This is a Unity 3D application that provides a Minecraft server management interface with advanced visualization capabilities. It includes RAM management, server configuration, performance monitoring, and 3D visualization of server status.

## Prerequisites
- Unity Hub (https://unity.com/download)
- Unity Editor 2021.3 LTS or newer
- UI Toolkit package (should be included by default in recent Unity versions)

## Complete Setup Instructions

### 1. Install Unity Hub and Editor
1. Download and install Unity Hub from https://unity.com/download
2. Launch Unity Hub
3. Click on "Installs" and then "Add"
4. Select version 2021.3 LTS or newer
5. Install the editor with the following modules:
   - Windows Build Support (if on Windows)
   - macOS Build Support (if on macOS)
   - Linux Build Support (if on Linux)

### 2. Import the Project
1. Open Unity Hub
2. Click the "Add" button in the Projects tab
3. Navigate to your `/Users/rene/ikaria/mc-server/unity-minecraft-admin` directory
4. Select the directory and click "Select Folder"
5. Unity Hub will detect the project and add it to your project list

### 3. Open the Project
1. Click on the "unity-minecraft-admin" project in Unity Hub
2. Unity Editor will launch with the project loaded
3. Unity will automatically import assets and compile scripts
4. The process may take a few minutes on first opening

### 4. Verify Project Setup
1. In the Project window (usually bottom-left), verify you see:
   - Assets/Scripts/ folder with subfolders (Data, Managers, UI, Visualization, API, etc.)
   - Assets/Scenes/MainScene.unity
   - Assets/Data/DataManager.asset
   - Assets/Resources/ folder with UI assets
2. Check the Console window (Window → General → Console) for any errors

### 5. Check Required Packages
1. Go to Window → Package Manager
2. Verify that UI Toolkit is installed (should be by default)
3. If missing, install it from the Package Manager

### 6. Fix Any Missing References
1. If there are any missing reference errors in the Console:
   - Select the Main Scene in the Project window
   - Open it (double-click)
   - Select the Minecraft Admin App GameObject in the Hierarchy
   - In the Inspector, check if all fields are properly assigned
   - If there are missing references, drag the appropriate components to the fields

### 7. Set Up the Minecraft Server API Connection
1. The project is configured to connect to `http://localhost:3000/api` by default
2. Make sure your Minecraft admin API server is running at that address
3. If you need to connect to a different address, update the APIManager component's URL

### 8. Configure the Scene
1. In the Hierarchy, select the Minecraft Admin App GameObject
2. In the Inspector, ensure the following components have references:
   - DataManager: Should reference the DataManager asset in Assets/Data/
   - APIManager: Should reference the APIManager component
   - Other managers should be automatically assigned
3. If any references are missing, drag the appropriate assets/components to fill them

## Running the Application

### In the Editor
1. Make sure you're on the MainScene (if not, double-click Assets/Scenes/MainScene.unity)
2. Click the Play button (▶) at the top of the editor
3. The application will start with the login screen
4. Default credentials: admin/admin123

### Building the Application
1. Go to File → Build Settings
2. If MainScene.unity is not listed, click "Add Open Scenes"
3. Select your target platform (Windows, Mac, Linux)
4. Click "Build"
5. Choose an output directory
6. Unity will compile and create a standalone executable

## Key Features
- **3D Visualization**: Server status represented by 3D cubes that change color/size based on metrics
- **RAM Management**: Visualize and configure RAM allocation per server
- **Server Management**: Start/stop/restart servers directly from the interface
- **Performance Monitoring**: Real-time CPU, memory, and player count tracking
- **Configuration Management**: Adjust server parameters like RAM, game rules, etc.
- **Dashboard**: Overview of all servers with performance metrics

## Troubleshooting

### Common Issues:
1. **Missing Script Errors**: Make sure all .cs files were properly imported
2. **Missing Asset References**: Check the Inspector for the Minecraft Admin App GameObject
3. **UI Not Loading**: Verify UI Toolkit package is installed
4. **Connection Issues**: Ensure the Minecraft admin API server is running and accessible

### If UI Toolkit Components Show Errors:
1. Go to Edit → Preferences → External Tools
2. Verify your external script editor is set properly
3. Go to Assets → Reimport All

## Development Notes
- The application follows a modular architecture with separate data, UI, and API layers
- 3D visualization uses Unity's built-in rendering engine
- UI is built with Unity's UI Toolkit for maximum flexibility
- The project includes comprehensive RAM management and server configuration features
- All changes to this project can be made via the Unity Editor after import

## Next Steps
1. Run the application in the editor to verify everything works
2. Customize the UI by modifying the USS stylesheets in Assets/Resources/
3. Extend functionality by adding components to the existing architecture
4. Build for your target platform for deployment