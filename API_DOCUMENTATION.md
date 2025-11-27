# Minecraft Server Admin API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All admin endpoints require Basic Authentication with the configured credentials (default: admin/admin123)

## Endpoints

### Server Management

#### GET `/servers/status`
Get status of all Minecraft servers

**Response:**
```json
{
  "mc-ilias": {
    "server": "mc-ilias",
    "status": "running",
    "rawStatus": {},
    "players": [],
    "playerCount": 0,
    "memory": "111.61MB",
    "cpu": "70.36%"
  },
  "mc-niilo": {
    "server": "mc-niilo",
    "status": "running",
    "rawStatus": {},
    "players": [],
    "playerCount": 0,
    "memory": "127.27MB",
    "cpu": "111.28%"
  }
  // ... additional servers
}
```

#### GET `/servers/status/:server`
Get status of a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier (e.g., mc-ilias, mc-niilo)

**Response:**
```json
{
  "server": "mc-ilias",
  "status": "running",
  "rawStatus": {},
  "players": [],
  "playerCount": 0,
  "memory": "111.61MB",
  "cpu": "70.36%"
}
```

#### POST `/servers/start/:server`
Start a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
{
  "success": true,
  "message": "mc-ilias started"
}
```

#### POST `/servers/stop/:server`
Stop a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
{
  "success": true,
  "message": "mc-ilias stopped"
}
```

#### POST `/servers/restart/:server`
Restart a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
{
  "success": true,
  "message": "mc-ilias restarted"
}
```

### Server Configuration

#### GET `/servers/config/:server`
Get configuration of a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
{
  "minMemory": "1G",
  "maxMemory": "4G",
  "motd": "Welcome to mc-ilias server!",
  "onlineMode": true,
  "maxPlayers": 20,
  "viewDistance": 10,
  "levelName": "world",
  "levelSeed": "",
  "levelType": "DEFAULT",
  "gameMode": "survival",
  "difficulty": "normal"
}
```

#### POST `/servers/config/:server`
Update configuration of a specific Minecraft server

**Parameters:**
- `server` (string): Server identifier

**Request Body:**
```json
{
  "minMemory": "2G",
  "maxMemory": "6G",
  "motd": "New MOTD",
  "onlineMode": false,
  "maxPlayers": 30,
  "viewDistance": 12,
  "levelName": "world",
  "levelSeed": "",
  "levelType": "DEFAULT",
  "gameMode": "creative",
  "difficulty": "hard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration for mc-ilias updated successfully",
  "config": {
    // Updated configuration details
  }
}
```

### Datapacks Management

#### GET `/datapacks/:server`
Get list of available and installed datapacks for a server

**Parameters:**
- `server` (string): Server identifier
- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of items per page (default: 20, max: 100)

**Response:**
```json
{
  "datapacks": [
    {
      "name": "example-datapack",
      "version": "1.0.0",
      "description": "An example datapack",
      "installed": true,
      "dir": "example-datapack"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### GET `/datapacks/search`
Search for available datapacks

**Query Parameters:**
- `q` (optional, string): Search query
- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of items per page (default: 20, max: 100)

**Response:**
```json
{
  "datapacks": [
    {
      "name": "example-datapack",
      "version": "1.0.0",
      "description": "An example datapack",
      "author": "Example Author"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### POST `/datapacks/install/:server`
Install a datapack on a server

**Parameters:**
- `server` (string): Server identifier

**Request Body:**
```json
{
  "datapackName": "example-datapack",
  "version": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Datapack installed successfully"
}
```

#### POST `/datapacks/uninstall/:server`
Uninstall a datapack from a server

**Parameters:**
- `server` (string): Server identifier

**Request Body:**
```json
{
  "datapackDir": "example-datapack"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Datapack uninstalled successfully"
}
```

### Public Endpoints (No Authentication Required)

#### GET `/public/status/all`
Get public status of all Minecraft servers

**Response:**
```json
{
  "mc-ilias": {
    "server": "mc-ilias",
    "status": "running",
    "players": [],
    "playerCount": 0
  }
}
```

#### GET `/public/history/:server`
Get historical data for a specific server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
[
  {
    "timestamp": 1678886400000,
    "playerCount": 5,
    "cpu": "25.5%",
    "memory": "2048.00MB"
  }
]
```

#### GET `/public/datapacks/:server`
Get public datapack information for a server

**Parameters:**
- `server` (string): Server identifier

**Response:**
```json
{
  "datapacks": [
    {
      "name": "example-datapack",
      "version": "1.0.0",
      "description": "An example datapack",
      "installed": true
    }
  ]
}
```

## Error Responses

When an error occurs, the API returns a JSON object with an error message:

```json
{
  "error": "Error message"
}
```

For validation errors:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "value": "",
      "msg": "Server name is required",
      "param": "server",
      "location": "params"
    }
  ]
}
```

## RAM Management

The API supports RAM management through the configuration endpoints. You can adjust both min and max memory allocation for each server:

- `minMemory`: Minimum RAM allocation (e.g., "1G", "1024M")
- `maxMemory`: Maximum RAM allocation (e.g., "4G", "4096M")

When updating server configuration, changing these values will modify the Java runtime parameters for the Minecraft server container.