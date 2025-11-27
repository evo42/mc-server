# Minecraft Server Admin API - Unity Integration Guide

## Overview
This document describes how the Unity Minecraft Admin Panel integrates with the Minecraft Server Admin API, with particular focus on RAM management capabilities.

## RAM Management Features

### Server RAM Configuration
The system provides comprehensive RAM management through the following features:

1. **Min/Max Memory Settings**
   - `minMemory`: Minimum RAM allocation for a server (e.g., "1G", "1024M")
   - `maxMemory`: Maximum RAM allocation for a server (e.g., "4G", "4096M")

2. **RAM Calculation Functions**
   - `GetTotalAllocatedRAM()`: Calculates total RAM allocated across all servers
   - `GetTotalUsedRAM()`: Calculates total RAM currently in use
   - `GetTotalRAMUtilization()`: Calculates overall RAM utilization percentage
   - `GetServerAllocatedRAM(string serverId)`: Gets allocated RAM for a specific server
   - `GetServerUsedRAM(string serverId)`: Gets currently used RAM for a specific server
   - `GetServerRAMUtilization(string serverId)`: Gets RAM utilization percentage for a specific server

### 3D Visualization
The 3D visualization engine represents RAM allocation and usage through:
- Cube size scaling based on memory usage relative to allocation
- Color coding based on memory utilization (green for low usage, red for high usage)
- Rotation speed based on CPU usage

### API Integration
The Unity application communicates with the API server through the APIManager class, which handles:
- Server status retrieval
- Server configuration updates (including RAM settings)
- RAM allocation changes
- Real-time status updates

## Unity Component Integration

### DataManager
The DataManager scriptable object manages all server data and RAM calculations:
- Stores server information including RAM allocation settings
- Performs RAM calculation functions
- Provides data aggregation for the UI

### ServerConfigurationView
The server configuration view allows users to:
- View current RAM settings
- Modify min/max memory allocation
- Validate RAM settings before saving
- Send updated configuration to the server

### DashboardView
The dashboard displays RAM-related metrics:
- Total allocated RAM
- RAM utilization percentage
- RAM headroom
- Per-server RAM usage visualization

### APIManager
Handles all communication with the server API:
- Retrieves server configuration
- Updates RAM allocation settings
- Listens for configuration updates
- Provides real-time status updates

## RAM Validation
The system includes RAM validation to ensure:
- Minimum memory is not greater than maximum memory
- Unit conversions are properly handled (GB to MB, etc.)
- Values are within acceptable ranges

## Security Considerations
- All API calls require authentication
- Input values are validated before processing
- Memory values are sanitized to prevent injection attacks

## Performance Optimization
- Efficient data structures for server management
- Caching of server data to reduce API calls
- Optimized 3D rendering for visualization
- Memory-efficient data storage

## Usage Examples

### Setting Server RAM Allocation
```csharp
// Update RAM allocation for a server
dataManager.UpdateServerRAMAllocation("mc-ilias", "2G", "8G");

// Get RAM utilization metrics
float totalAllocated = dataManager.GetTotalAllocatedRAM();
float totalUsed = dataManager.GetTotalUsedRAM();
float utilization = dataManager.GetTotalRAMUtilization();
```

### Visualizing RAM Usage
The 3D visualization system automatically updates based on server data, showing:
- Relative size of cubes based on RAM usage
- Color coding based on utilization levels
- Rotation speed indicating CPU load

## Troubleshooting

### Common Issues
- **Invalid RAM values**: Ensure min memory is not greater than max memory
- **Unit conversion errors**: RAM values should use standard units (G, M, K, B)
- **API connectivity issues**: Verify API server is running and accessible

### Logging
RAM utilization metrics are logged to the Unity console:
```
RAM Utilization Metrics - Allocated: 12288.00 MB, Used: 6144.00 MB, Utilization: 50.00%
```

## API Endpoints Used

### Server Management
- `GET /api/servers/status` - Get status of all servers
- `POST /api/servers/config/:server` - Update server configuration including RAM settings

### Configuration Management
- `GET /api/servers/config/:server` - Get current server configuration
- `POST /api/servers/config/:server` - Update server configuration

## Testing
RAM management functionality can be tested using the RAMManagementTester component, which provides:
- RAM calculation validation
- Memory parsing tests
- Visualization updates
- Configuration validation

The system is designed to be robust, secure, and efficient in managing RAM allocation across multiple Minecraft servers.