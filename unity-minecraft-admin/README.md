# Unity Minecraft Server Admin Panel

A comprehensive Unity 3D application for managing Minecraft servers with real-time visualization, RAM management, and configuration tools.

## Features

- 3D server visualization with cube representations
- Comprehensive RAM management per server
- Real-time monitoring of server metrics (CPU, memory, players)
- Server control (start/stop/restart)
- Configuration management with RAM settings
- Datapack management
- Dashboard with performance metrics
- UI Toolkit interface with responsive design

## Requirements

- Unity 2021.3 LTS or newer
- UI Toolkit package
- Unity Test Framework (for running tests)

## Setup

1. Clone the repository
2. Open the project in Unity Hub
3. Allow Unity to import packages and compile scripts
4. Open the MainScene in Assets/Scenes/

## Code Quality Analysis

### Linting
The project follows Unity C# coding conventions:

- PascalCase for public members, camelCase for private members
- Descriptive names for variables and methods
- Proper using statements organized alphabetically
- Consistent spacing and indentation (4 spaces)
- XML documentation for public classes and methods

Unity's built-in code analysis can be run through:
- Window → Analysis → Code Analysis
- Or via command line using Unity's CI tools

### Static Analysis Configuration
Code analysis is configured in `.editorconfig` files to enforce:
- Naming conventions
- Proper access modifiers
- Unused variable detection
- Performance optimizations

## Testing

### Unit Tests
Located in `Assets/Scripts/Tests/`:
- RAMManagementTests.cs: Tests for RAM calculation and management
- ServerDataModelTests.cs: Tests for server data model functionality
- APITests.cs: Tests for API integration and responses

To run tests:
1. Open Unity Test Runner: Window → General → Test Runner
2. Select "PlayMode Tests" or "EditMode Tests"
3. Run all tests or specific test suites

### Test Coverage
The application includes tests for:
- RAM allocation and calculation methods
- Memory string parsing (GB, MB, KB, B)
- Server configuration updates
- Data manager functionality
- API communication

## RAM Management Capabilities

### Core Features
- Per-server minimum and maximum memory allocation
- Real-time RAM utilization tracking
- RAM allocation visualization in 3D cubes
- RAM configuration interface
- RAM utilization metrics in dashboard

### Key Classes
- DataManager: Manages server data and RAM calculations
- ServerData: Model with RAM allocation properties
- APIManager: Handles server configuration updates
- Server3DVisualization: Visualizes RAM allocation in 3D

### RAM Calculation Methods
- GetTotalAllocatedRAM(): Total RAM allocated across all servers
- GetTotalUsedRAM(): Total RAM currently in use
- GetTotalRAMUtilization(): Percentage of allocated RAM being used
- GetServerRAMUtilization(): Per-server RAM utilization
- UpdateServerRAMAllocation(): Update RAM settings for specific server

## Project Architecture

### Data Layer
- DataManager (ScriptableObject): Central data management
- ServerData: Server information model
- ServerConfig: Server configuration model

### API Layer
- APIManager: Communication with server API
- ServerPollingService: Periodic status updates

### UI Layer
- MainSceneController: Main UI controller
- DashboardView: Dashboard interface
- ServerListView: Server list interface
- ServerConfigurationView: Server configuration interface

### Visualization Layer
- ThreeDServerVisualization: 3D server visualization system
- ServerCube: Individual server visualization

## Build Instructions

### For Development
1. Open Build Settings (File → Build Settings)
2. Select your target platform
3. Ensure MainScene is in the Scenes In Build list
4. Click Build and Run

### For Production
1. Follow development build steps
2. Ensure API endpoints are configured for production
3. Optimize graphics settings for deployment

## Troubleshooting

### Common Issues
- API not responding: Check that the Minecraft admin API is running and accessible
- RAM values not showing: Verify server configuration endpoints are accessible
- 3D cubes not appearing: Check that the camera and cube prefab are properly configured

### Performance Tips
- Limit polling interval if experiencing network lag
- Reduce number of simultaneously visualized servers in 3D view for performance
- Use compact view mode when monitoring many servers

## Development Guidelines

### Adding New RAM Management Features
1. Update ServerData model with new RAM-related properties
2. Add corresponding methods to DataManager
3. Update APIManager to communicate with backend API
4. Add UI controls to ServerConfigurationView
5. Update 3D visualization to reflect the new values
6. Add unit tests for new functionality

### Testing New Features
1. Create unit tests for new functionality
2. Verify API integration works with actual Minecraft server
3. Test UI interactions
4. Ensure 3D visualization properly reflects new data
5. Verify all RAM calculation methods work correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add unit tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Unity Technologies for the Unity engine and UI Toolkit
- Minecraft community for inspiration
- Original Vue.js admin panel contributors