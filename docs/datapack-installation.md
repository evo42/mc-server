# Datapack Installation Instructions

## VanillaTweaks Datapack Setup

The server is configured to support datapacks, including the one from the provided VanillaTweaks link.

### To install the VanillaTweaks datapack from https://vanillatweaks.net/share#cAGBWC:

1. Visit the URL in your browser: https://vanillatweaks.net/share#cAGBWC
2. Click the download button on the page
3. You should receive a .zip file containing the datapack
4. Extract the .zip file if needed - it should contain a folder with the datapack
5. Place the datapack folder in either:
   - For mc-Ikaria Games: `./mc-ilias/datapacks/`
   - For mc-KDLK.net: `./mc-niilo/datapacks/`

### Example:

If your downloaded datapack is named "vanillatweaks_datapack.zip" and contains a folder called "data_pack":

```bash
# For mc-ilias
unzip vanillatweaks_datapack.zip
cp -r data_pack/ ./mc-ilias/datapacks/

# For mc-niilo
unzip vanillatweaks_datapack.zip
cp -r data_pack/ ./mc-niilo/datapacks/
```

### Server Restart:
After placing the datapack in the appropriate directory, restart the Minecraft server for the changes to take effect.

The server will automatically copy any datapacks from the mounted directory to the server's datapacks folder when it starts. The datapack will be loaded automatically if it's compatible with Minecraft 1.21.10.

### Notes:
- The server is configured for Minecraft 1.21.10
- Datapacks are loaded from the `/home/minecraft/datapacks` directory in the container
- The server will continue to work with the datapacks even after updates