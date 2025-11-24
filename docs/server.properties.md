# Minecraft Server Properties (Java Edition 1.21.x)

This document provides a comprehensive list of all `server.properties` settings for a Minecraft Java Edition server, version 1.21.x.

The `server.properties` file is located in the root directory of your Minecraft server. Changes to this file require a server restart to take effect.

---

## Server Properties

| Key | Type | Default Value | Description |
| --- | --- | --- | --- |
| **accepts-transfers** | boolean | `false` | Whether to accept incoming transfers via a transfer packet. |
| **allow-flight** | boolean | `false` | Allows players to use flight in Survival mode if they have a mod that provides it. |
| **broadcast-console-to-ops** | boolean | `true` | Sends console command outputs to all online operators. |
| **broadcast-rcon-to-ops** | boolean | `true` | Sends rcon console command outputs to all online operators. |
| **bug-report-link** | string | _blank_ | The URL for the `report_bug` server link. |
| **difficulty** | string | `easy` | The game difficulty. Can be `peaceful`, `easy`, `normal`, or `hard`. |
| **enable-code-of-conduct** | boolean | `false` | Whether the server will look for code of conduct files in the `codeofconduct` subfolder. |
| **enable-jmx-monitoring** | boolean | `false` | Exposes a JMX MBean with server performance metrics. |
| **enable-query** | boolean | `false` | Enables the GameSpy4 protocol server listener. Used to get information about the server. |
| **enable-rcon** | boolean | `false` | Enables remote access to the server console. |
| **enable-status** | boolean | `true` | Whether the server appears as "online" on the server list. |
| **enforce-secure-profile** | boolean | `true` | Whether to only allow players with a Mojang-signed public key to join. |
| **enforce-whitelist** | boolean | `false` | Enforces the whitelist on the server. When enabled, only players on the whitelist can join. |
| **entity-broadcast-range-percentage** | integer | `100` | The percentage of the default entity broadcast range. |
| **force-gamemode** | boolean | `false` | Forces players to join in the default gamemode. |
| **function-permission-level** | integer | `2` | The default permission level for functions. |
| **gamemode** | string | `survival` | The default gamemode. Can be `survival`, `creative`, `adventure`, or `spectator`. |
| **generate-structures** | boolean | `true` | Determines if structures (like villages, temples) will be generated. |
| **generator-settings** | string | `{}` | The settings used to customize world generation. |
| **hardcore** | boolean | `false` | If set to `true`, players are set to Spectator mode if they die. |
| **hide-online-players** | boolean | `false` | Whether to disable sending the player list on status requests. |
| **initial-disabled-packs** | string | _blank_ | Datapacks to not be auto-enabled on world creation. |
| **initial-enabled-packs** | string | `vanilla` | Datapacks to be enabled on world creation. |
| **level-name** | string | `world` | The name of the world directory. |
| **level-seed** | string | _blank_ | The seed for the world. If left blank, a random seed is used. |
| **level-type** | string | `minecraft:normal` | The type of world to be generated. |
| **log-ips** | boolean | `true` | Whether to show client IP addresses in messages printed to the server console or the log file. |
| **management-server-enabled** | boolean | `false` | Whether the Minecraft Server Management Protocol is enabled. |
| **management-server-host** | string | `localhost` | Controls the host that the Minecraft Server Management Protocol is started. |
| **management-server-port** | integer | `0` | Controls the port that the Minecraft Server Management Protocol is started. |
| **management-server-secret** | string | _blank_ | Allows for clients to supply an `Authorization` header with a server specific secret. |
| **management-server-tls-enabled** | boolean | `true` | Controls whether the Minecraft Server Management Protocol uses TLS. |
| **management-server-tls-keystore** | string | _blank_ | Controls the path to the keystore file used for TLS. |
| **management-server-tls-keystore-password** | string | _blank_ | Controls the password to the keystore file used for TLS. |
| **max-chained-neighbor-updates** | integer | `1000000` | The limit of consecutive neighbor updates before skipping additional ones. |
| **max-players** | integer | `20` | The maximum number of players that can connect to the server. |
| **max-tick-time** | integer | `60000` | The maximum number of milliseconds a single tick may take before the server watchdog stops the server. |
| **max-world-size** | integer | `29999984` | The maximum radius of the world, in blocks. |
| **motd** | string | `A Minecraft Server` | The message that is displayed in the server list of the client. |
| **network-compression-threshold** | integer | `256` | The network compression threshold. Set to -1 to disable. |
| **online-mode** | boolean | `true` | If `true`, the server verifies players with Mojang's authentication servers. |
| **op-permission-level** | integer | `4` | The default permission level for ops. |
| **pause-when-empty-seconds** | integer | `60` | How many seconds have to pass after no player has been online before the server is paused. |
| **player-idle-timeout** | integer | `0` | The time in minutes a player can be idle before being kicked. 0 disables this. |
| **prevent-proxy-connections** | boolean | `false` | If `true`, players connecting from a proxy or VPN will be kicked. |
| **query.port** | integer | `25565` | The port for the query server. |
| **rate-limit** | integer | `0` | The maximum amount of packets a player can send before getting kicked. 0 disables this. |
| **rcon.password** | string | _blank_ | The password for rcon. |
| **rcon.port** | integer | `25575` | The port for rcon. |
| **region-file-compression** | string | `deflate` | The algorithm used for compressing chunks in regions. |
| **require-resource-pack** | boolean | `false` | Whether players are disconnected if they decline to use the resource pack. |
| **resource-pack** | string | _blank_ | The URL to a resource pack. Players will be prompted to download it. |
| **resource-pack-id** | UUID | _blank_ | An optional UUID for the resource pack. |
| **resource-pack-prompt** | string | _blank_ | A custom message to be shown on resource pack prompt. |
| **resource-pack-sha1** | string | _blank_ | The SHA-1 hash of the resource pack. |
| **server-ip** | string | _blank_ | The IP address the server will listen on. |
| **server-port** | integer | `25565` | The port the server will listen on. |
| **simulation-distance** | integer | `10` | The maximum distance from players that entities are updated, in chunks. |
| **spawn-protection** | integer | `16` | The radius of the spawn protection. |
| **status-heartbeat-interval** | integer | `0` | Controls the intervals in which the management server sends heartbeat notifications to connected clients. |
| **sync-chunk-writes** | boolean | `true` | Enables synchronous chunk writes. |
| **text-filtering-config** | string | _blank_ | Configuration for the chat filtering mechanism. |
| **text-filtering-version** | integer | `0` | The version of the configuration format used for text-filtering-config. |
| **use-native-transport** | boolean | `true` | Use optimized packet sending on Linux. |
| **view-distance** | integer | `10` | The number of chunks visible to players. |
| **white-list** | boolean | `false` | Enables the server whitelist. |
