# Minecraft Server Resource Requirements and Cost Analysis

## Overview
This document outlines the resource requirements for Minecraft servers supporting different numbers of concurrent players, along with cost calculations based on Contabo's VDS pricing plans. The analysis covers server requirements for 15, 50, and 150 concurrent users.

## Minecraft Server Resource Requirements

### For 15 Concurrent Users:
- **RAM**: 4-8 GB
  - Vanilla server: 4-6 GB is sufficient
  - Modded server: 6-8 GB recommended
- **CPU**: 
  - Single core performance is most important (3.5+ GHz)
  - 4-6 physical cores minimum, though 8 cores recommended for better performance
- **Storage**: 
  - SSD storage recommended for faster world loading
  - 20-50 GB depending on world size and plugins/mods
- **Network**: 
  - 10-50 Mbps upload speed depending on server activity
  - Low latency (ping) connection

### For 50 Concurrent Users:
- **RAM**: 8-16 GB
  - Vanilla server: 8-12 GB
  - Modded server: 12-16 GB or more, especially with many plugins
- **CPU**:
  - Strong single-thread performance (3.5+ GHz)
  - 8-12 physical cores recommended
  - Multi-core performance becomes more important as player count increases
- **Storage**:
  - Fast SSD storage highly recommended
  - 50-150 GB depending on world size and activity
- **Network**:
  - 100+ Mbps dedicated connection
  - Dedicated uplink for better performance

### For 150 Concurrent Users:
- **RAM**: 16-40 GB or more
  - Vanilla server: 16-24 GB
  - Modded server: 24-40 GB or more (with very large modpacks)
- **CPU**:
  - Excellent single-thread performance (3.5+ GHz)
  - 12+ physical cores strongly recommended (some setups use 2x 14-core Xeon processors)
  - High-end processor with good multi-threading capabilities
- **Storage**:
  - Fast NVMe SSDs required
  - 150+ GB with potential for much more depending on world size
- **Network**:
  - 1 Gbps dedicated uplink
  - Multiple Gbps connection for optimal performance

## General Recommendations:
1. **CPU Importance**: Minecraft is primarily single-threaded, so prioritize CPU with high single-core performance (3.5+ GHz) over many cores. However, for larger servers (50+ players), multi-core performance becomes increasingly important.

2. **RAM Guidelines**: As a rough rule of thumb:
   - Vanilla servers: 1 GB RAM per 10-20 players
   - Modded servers: 4-8 GB RAM per 10-20 players depending on mod count

3. **Storage**: Always use SSD storage for Minecraft servers, as world loading is I/O intensive. NVMe SSDs are preferred for large servers.

4. **Network**: Higher player counts require faster internet connections, both upload and download speeds. Low latency is critical for player experience.

5. **Additional Considerations**:
   - For modded servers, factor in the additional RAM requirements from plugins and mods
   - Allocate slightly more RAM than the minimum requirement for a buffer
   - Consider using server optimization plugins like PaperMC or Airplane for better performance
   - Monitor server performance and adjust resources as needed

## Contabo VDS Pricing Information
- Cloud VDS S: 3 cores, 24GB RAM, 180GB NVMe, €32.24/month (€386.88/year)
- Cloud VDS M: 4 cores, 32GB RAM, 240GB NVMe, €41.99/month (€503.88/year)
- Cloud VDS L: 6 cores, 48GB RAM, 360GB NVMe, €59.99/month (€719.88/year)
- Cloud VDS XL: 8 cores, 64GB RAM, 480GB NVMe, €77.24/month (€926.88/year)
- Cloud VDS XXL: 12 cores, 96GB RAM, 720GB NVMe, €112.49/month (€1,349.88/year)

## Cost Analysis for Minecraft Server Hosting

### For 15 Concurrent Users:
- **Requirements**: 4-8GB RAM, 4-6 CPU cores, 20-50GB SSD storage
- **Recommended Plan**: **Cloud VDS S**
  - 3 physical cores (slightly below requirement but sufficient for vanilla server)
  - 24GB RAM (significantly more than requirement)
  - 180GB NVMe storage (more than sufficient)
  - **Monthly Cost**: €32.24
  - **Annual Cost**: €386.88
- **Alternative Plan**: **Cloud VDS M** for better performance
  - 4 physical cores (meets minimum requirement)
  - 32GB RAM (more than sufficient)
  - 240GB NVMe storage (more than sufficient)
  - **Monthly Cost**: €41.99
  - **Annual Cost**: €503.88

### For 50 Concurrent Users:
- **Requirements**: 8-16GB RAM, 8-12 CPU cores, 50-150GB SSD storage
- **Recommended Plan**: **Cloud VDS L**
  - 6 physical cores (slightly below requirement for 50 players)
  - 48GB RAM (meets the higher end requirement)
  - 360GB NVMe storage (within the required range)
  - **Monthly Cost**: €59.99
  - **Annual Cost**: €719.88
- **Better Performance Plan**: **Cloud VDS XL**
  - 8 physical cores (meets minimum requirement)
  - 64GB RAM (exceeds requirement)
  - 480GB NVMe storage (exceeds requirement)
  - **Monthly Cost**: €77.24
  - **Annual Cost**: €926.88

### For 150 Concurrent Users:
- **Requirements**: 16-40GB RAM, 12+ CPU cores, 150GB+ SSD storage
- **Recommended Plan**: **Cloud VDS XXL**
  - 12 physical cores (meets minimum requirement)
  - 96GB RAM (meets higher requirements)
  - 720GB NVMe storage (exceeds requirement)
  - **Monthly Cost**: €112.49
  - **Annual Cost**: €1,349.88
- **Alternative**: Cloud VDS XXL is the most appropriate plan as it meets all requirements

## Cost Summary Table:

| Player Count | Recommended Plan | CPU Cores | RAM | Storage | Monthly Cost | Annual Cost |
|--------------|------------------|-----------|-----|---------|--------------|-------------|
| 15 Players | Cloud VDS S | 3 | 24GB | 180GB | €32.24 | €386.88 |
| 15 Players (Better Perf) | Cloud VDS M | 4 | 32GB | 240GB | €41.99 | €503.88 |
| 50 Players | Cloud VDS L | 6 | 48GB | 360GB | €59.99 | €719.88 |
| 50 Players (Better Perf) | Cloud VDS XL | 8 | 64GB | 480GB | €77.24 | €926.88 |
| 150 Players | Cloud VDS XXL | 12 | 96GB | 720GB | €112.49 | €1,349.88 |

## Additional Considerations:
- All Contabo VDS plans include unlimited traffic with speeds from 250 Mbit/s to 1 Gbit/s
- 100% dedicated RAM (no shared resources)
- Modern AMD EPYC processors
- Enterprise-quality NVMe SSD storage
- Option to add additional storage if needed

## Conclusion:
Contabo's VDS plans provide a cost-effective solution for hosting Minecraft servers. For smaller communities of 15 players, the Cloud VDS S offers excellent value at €32.24 per month (€386.88 per year). For medium-sized communities of 50 players, the Cloud VDS L provides sufficient resources at €59.99 per month (€719.88 per year). For large servers with 150 players, the Cloud VDS XXL offers the necessary resources at €112.49 per month (€1,349.88 per year).

The plans provide more RAM than the minimum requirements, which is beneficial for Minecraft server performance. The NVMe storage ensures fast world loading, which is critical for Minecraft servers with many players moving between chunks.