# BlueMap Configuration Summary

Generated on: 2025-12-01T17:42:09.284Z

## Server Overview

### 1. mc-basop-bafep-stp
- **Type**: Education Server
- **Port**: 8081
- **Max Players**: 20
- **Render Distance**: 3000
- **Cache Size**: 256MB
- **Concurrent Renders**: 2


### 2. mc-bgstpoelten
- **Type**: Secondary Education Server
- **Port**: 8082
- **Max Players**: 25
- **Render Distance**: 4000
- **Cache Size**: 384MB
- **Concurrent Renders**: 3


### 3. mc-borgstpoelten
- **Type**: Academic Server
- **Port**: 8083
- **Max Players**: 30
- **Render Distance**: 5000
- **Cache Size**: 512MB
- **Concurrent Renders**: 3


### 4. mc-hakstpoelten
- **Type**: University Server
- **Port**: 8084
- **Max Players**: 35
- **Render Distance**: 5000
- **Cache Size**: 512MB
- **Concurrent Renders**: 4


### 5. mc-htlstp
- **Type**: Technical College Server
- **Port**: 8085
- **Max Players**: 40
- **Render Distance**: 5000
- **Cache Size**: 512MB
- **Concurrent Renders**: 4


### 6. mc-ilias
- **Type**: Specialized Learning Server
- **Port**: 8086
- **Max Players**: 15
- **Render Distance**: 2500
- **Cache Size**: 192MB
- **Concurrent Renders**: 2


### 7. mc-niilo
- **Type**: Public Community Server
- **Port**: 8087
- **Max Players**: 50
- **Render Distance**: 6000
- **Cache Size**: 768MB
- **Concurrent Renders**: 5


## Performance Settings
- **Lazy Loading**: Enabled for all servers
- **WebGL**: Enabled for enhanced 3D performance
- **Cache Strategy**: Server-specific cache sizes
- **Monitoring**: Prometheus metrics enabled
- **Security**: CORS configured for all origins

## Next Steps
1. Test configurations in development environment
2. Deploy to production servers
3. Monitor performance metrics
4. Fine-tune based on usage patterns
