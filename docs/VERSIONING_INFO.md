# Minecraft Version and PaperMC Clarification

## Correct Version Information

There is **no such thing as Minecraft 1.12.10** or **Paper 1.12.10**.

### Minecraft Versioning
- Minecraft 1.12.2 is the last version in the 1.12.x series
- After 1.12.2, Minecraft versioning jumps to 1.13.0
- The series continues: 1.13.x, 1.14.x, 1.15.x, 1.16.x, 1.17.x, 1.18.x, 1.19.x, 1.20.x, 1.21.x

### PaperMC Versioning
- PaperMC follows Minecraft versioning exactly
- Paper 1.12.2 is the last Paper version for Minecraft 1.12.2
- After that, Paper continues with 1.13.x builds, then 1.14.x, etc.

### Current Platform Support
- The Minecraft SaaS Platform currently supports **Minecraft 1.21.1**
- This is accomplished by downloading the latest compatible Paper build for Minecraft 1.21.1
- The platform's universal image can support any Paper-compatible Minecraft version

## Supported Versions

The platform's universal Minecraft image supports these Minecraft versions:
- 1.12.2 (and higher)
- 1.13.x, 1.14.x, 1.15.x, 1.16.x, 1.17.x, 1.18.x, 1.19.x, 1.20.x, 1.21.x
- Including 1.21.1 (currently configured)

## Version Configuration

To change the Minecraft version, simply update the VERSION environment variable:
```
MC_VERSION=1.21.1  # Currently configured
```

Or for other supported versions:
```
MC_VERSION=1.20.6  # Or any other Paper-supported version
MC_VERSION=1.19.4
MC_VERSION=1.18.2
# etc.
```

## Note on Non-Existent Versions

If you were looking for Minecraft 1.12.10, please be aware that:
- No such Minecraft version exists
- No such Paper version exists
- The last 1.12.x version is 1.12.2
- After 1.12.2, the next major versions are 1.13.0, 1.14.0, etc.

The platform is currently configured to support Minecraft 1.21.1, which is the correct and current version that should be used.