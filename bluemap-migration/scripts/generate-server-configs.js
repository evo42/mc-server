#!/usr/bin/env node
/**
 * BlueMap Server Configuration Generator
 * Generates individual BlueMap configurations for all 7 Minecraft servers
 */

const fs = require('fs');
const path = require('path');

// Server configurations
const servers = [
  {
    name: 'mc-basop-bafep-stp',
    port: 8081,
    prometheusPort: 9091,
    maxPlayers: 20,
    serverType: 'education',
    renderDistance: 3000,
    cacheSize: '256MB',
    maxConcurrentRenders: 2,
    description: 'Education Server',
    customFeatures: ['education_areas', 'workshops']
  },
  {
    name: 'mc-bgstpoelten',
    port: 8082,
    prometheusPort: 9092,
    maxPlayers: 25,
    serverType: 'secondary_education',
    renderDistance: 4000,
    cacheSize: '384MB',
    maxConcurrentRenders: 3,
    description: 'Secondary Education Server',
    customFeatures: ['science_labs', 'sports_facilities', 'cafeteria']
  },
  {
    name: 'mc-borgstpoelten',
    port: 8083,
    prometheusPort: 9093,
    maxPlayers: 30,
    serverType: 'academic',
    renderDistance: 5000,
    cacheSize: '512MB',
    maxConcurrentRenders: 3,
    description: 'Academic Server',
    customFeatures: ['research_centers', 'libraries', 'auditoriums']
  },
  {
    name: 'mc-hakstpoelten',
    port: 8084,
    prometheusPort: 9094,
    maxPlayers: 35,
    serverType: 'university',
    renderDistance: 5000,
    cacheSize: '512MB',
    maxConcurrentRenders: 4,
    description: 'University Server',
    customFeatures: ['research_institutes', 'lecture_halls', 'dormitories']
  },
  {
    name: 'mc-htlstp',
    port: 8085,
    prometheusPort: 9095,
    maxPlayers: 40,
    serverType: 'technical',
    renderDistance: 5000,
    cacheSize: '512MB',
    maxConcurrentRenders: 4,
    description: 'Technical College Server',
    customFeatures: ['workshops', 'laboratories', 'engineering_areas']
  },
  {
    name: 'mc-ilias',
    port: 8086,
    prometheusPort: 9096,
    maxPlayers: 15,
    serverType: 'specialized',
    renderDistance: 2500,
    cacheSize: '192MB',
    maxConcurrentRenders: 2,
    description: 'Specialized Learning Server',
    customFeatures: ['specialized_labs', 'small_groups']
  },
  {
    name: 'mc-niilo',
    port: 8087,
    prometheusPort: 9097,
    maxPlayers: 50,
    serverType: 'public',
    renderDistance: 6000,
    cacheSize: '768MB',
    maxConcurrentRenders: 5,
    description: 'Public Community Server',
    customFeatures: ['community_centers', 'public_buildings', 'entertainment_areas']
  }
];

// Generate configuration template
function generateServerConfig(server) {
  return `# BlueMap Configuration for ${server.name}
# Server ${servers.indexOf(server) + 1} von 7 - ${server.description}

# Include base configuration
@include "../../config/bluemap-base.conf"

# =============================================================================
# Server-spezifische Konfiguration für ${server.name}
# =============================================================================

blueMap:

  # Web Interface für diesen Server
  web:
    port: ${server.port}  # Eindeutiger Port für ${server.name}
    rootPath: "/bluemap/${server.name}/"

    # Server-spezifische Security
    security:
      allowedOrigins: [
        "http://localhost:3000",
        "https://admin.lerncraft.xyz",
        "https://${server.name}.lerncraft.xyz"
      ]

  # Lazy Server Konfiguration für ${server.description}
  lazy:
    enabled: true
    cacheSize: "${server.cacheSize}"
    maxConcurrentRenders: ${server.maxConcurrentRenders}
    renderDistance: ${server.renderDistance}
    chunkLoadingRadius: ${server.serverType === 'public' ? 32 : 28}

    # ${server.description} Optimizations
    performance:
      useWebGL: true
      enableGPUAcceleration: true
      maxFPS: ${server.serverType === 'public' ? 60 : 45}
      adaptiveQuality: true

  # Monitoring für ${server.description}
  monitoring:
    enabled: true
    serverName: "${server.name}"
    prometheus:
      enabled: true
      port: ${server.prometheusPort}

# World Configuration für ${server.name}
worlds:

  # Haupt-World für ${server.name}
  ${server.name}-world:
    enabled: true
    worldPath: "/minecraft/worlds/${server.name}/world"
    worldName: "${server.name}"

    # Lazy Loading aktiviert
    lazyLoading: true
    renderDistance: ${server.renderDistance}

    # Web Interface für ${server.description}
    web:
      enabled: true
      threeDimension:
        enabled: true
        useWebGL: true
        showBiomes: true
        showHeight: true
        lighting: true
        # ${server.description} specific settings
        showGrid: true
        showCoords: true
        showPlayerNames: true
        ${server.serverType !== 'specialized' ? 'showMobs: true' : ''}
        ${server.serverType === 'public' ? 'showStructures: true' : ''}

      flat:
        enabled: true
        showGrid: true
        showCoords: true
        showBiomes: true
        ${server.serverType === 'public' ? 'showStructures: true' : ''}

    # POI Configuration für ${server.description}
    poi:
      enabled: true
      autoDetect:
        enabled: true
        spawnPoints: true
        netherPortals: true
        endPortals: true
        villages: true
        structures: true
        monuments: true
        ${server.serverType === 'public' ? 'buildings: true' : ''}

      types:
        ${server.customFeatures.map(feature => `
        ${feature.replace(/_/g, '_')}:
          icon: "${feature}.png"
          label: "${feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"
          description: "${feature.replace(/_/g, ' ')} area"
          showName: true
          maxDistance: ${server.serverType === 'public' ? 1500 : 1000}`).join('')}

  # Additional World: nether für ${server.name}
  ${server.name}_nether:
    enabled: true
    worldPath: "/minecraft/worlds/${server.name}/world_nether"
    worldName: "${server.name}_nether"

    lazyLoading: true
    renderDistance: ${Math.floor(server.renderDistance * 0.75)}

    web:
      enabled: true
      threeDimension:
        enabled: true
        useWebGL: true
        showBiomes: false
        showHeight: true
        lighting: true

  # Additional World: end für ${server.name}
  ${server.name}_end:
    enabled: true
    worldPath: "/minecraft/worlds/${server.name}/world_the_end"
    worldName: "${server.name}_end"

    lazyLoading: true
    renderDistance: ${Math.floor(server.renderDistance * 0.5)}

    web:
      enabled: true
      threeDimension:
        enabled: true
        useWebGL: true
        showBiomes: false
        showHeight: true
        lighting: true

# Marker Sets für ${server.description}
markerSets:
  enabled: true

  # ${server.description} Markers
  ${server.serverType.replace(/_/g, '_')}_markers:
    label: "${server.description} Areas"
    toggleable: true
    defaultHidden: false

    markers:
      # World Spawn
      world_spawn:
        type: "icon"
        icon: "${server.serverType}-spawn.png"
        label: "${server.description} Spawn"
        description: "Main spawn point"
        position:
          x: 0
          y: 64
          z: 0

      # Main Building
      main_building:
        type: "icon"
        icon: "main-building.png"
        label: "Main ${server.description} Building"
        description: "Central facility"
        position:
          x: 100
          y: 64
          z: -50

      # Resource Center
      resource_center:
        type: "icon"
        icon: "library.png"
        label: "Resource Center"
        description: "Learning and reference materials"
        position:
          x: -80
          y: 64
          z: 120

# Server-spezifische Einstellungen
serverSpecific:
  maxPlayers: ${server.maxPlayers}
  serverType: "${server.serverType}"
  maintenanceMode: false

  # Admin API Integration
  adminIntegration:
    enabled: true
    apiKey: "bluemap-${server.name}-2024"
    webhookUrl: "http://localhost:3000/api/bluemap/webhook/${server.name}"

  # ${server.description} Features
  advancedFeatures:
    enabled: true
    # Specific features per server type
    ${server.serverType === 'education' ? 'studentAreas: true' : ''}
    ${server.serverType === 'secondary_education' ? 'collaborativeSpaces: true' : ''}
    ${server.serverType === 'academic' ? 'researchAreas: true' : ''}
    ${server.serverType === 'university' ? 'lectureHalls: true' : ''}
    ${server.serverType === 'technical' ? 'workshopSpaces: true' : ''}
    ${server.serverType === 'specialized' ? 'focusedLearning: true' : ''}
    ${server.serverType === 'public' ? 'communityFeatures: true' : ''}
`;
}

// Generate all server configurations
function generateAllConfigs() {
  console.log('🔧 Generating BlueMap configurations for all 7 servers...\n');

  servers.forEach((server, index) => {
    const configPath = path.join(__dirname, '../configs', server.name);

    // Ensure directory exists
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath, { recursive: true });
    }

    // Generate configuration
    const config = generateServerConfig(server);
    const configFilePath = path.join(configPath, 'bluemap.conf');

    fs.writeFileSync(configFilePath, config);
    console.log(`✅ Generated configuration for ${server.name} (${index + 1}/7)`);
  });

  console.log('\n🎉 All server configurations generated successfully!');
  console.log('\n📁 Configuration files created in:');
  servers.forEach(server => {
    console.log(`   - configs/${server.name}/bluemap.conf`);
  });
}

// Generate summary report
function generateSummaryReport() {
  const report = `# BlueMap Configuration Summary

Generated on: ${new Date().toISOString()}

## Server Overview
${servers.map((server, index) => `
### ${index + 1}. ${server.name}
- **Type**: ${server.description}
- **Port**: ${server.port}
- **Max Players**: ${server.maxPlayers}
- **Render Distance**: ${server.renderDistance}
- **Cache Size**: ${server.cacheSize}
- **Concurrent Renders**: ${server.maxConcurrentRenders}
`).join('\n')}

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
`;

  fs.writeFileSync(path.join(__dirname, '../config-summary.md'), report);
  console.log('📊 Configuration summary saved to: config-summary.md');
}

// Main execution
if (require.main === module) {
  try {
    generateAllConfigs();
    generateSummaryReport();
    console.log('\n🚀 Ready for BlueMap deployment!');
  } catch (error) {
    console.error('❌ Error generating configurations:', error);
    process.exit(1);
  }
}

module.exports = { servers, generateServerConfig };