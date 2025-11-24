# Cloudflare DNS Setup for Minecraft Servers

This script will set up DNS records for your Minecraft servers on Cloudflare.

## Prerequisites

1. You must have a Cloudflare API token with DNS edit permissions
2. The API token should be exported as `CF_API_TOKEN` environment variable
3. You need the Zone ID and Account ID for the domain

## Configuration

The script is pre-configured with:
- Zone ID: `5bfda71acbd55cf4edd5a108ad66710a` (for ikaria.dev)
- Account ID: `b477bdfbe601c1077004973902aa628d`
- Domain: `ikaria.dev`
- Server IP: `161.97.82.122`

## Usage

1. Ensure your `CF_API_TOKEN` environment variable is set:
   ```bash
   export CF_API_TOKEN="your_cloudflare_api_token_here"
   ```

2. Run the script:
   ```bash
   ./setup-cloudflare-dns.sh
   ```

## What the script does

1. Creates A records for:
   - `mc-niilo.ikaria.dev`
   - `mc-ilias.ikaria.dev`
   - `mc.ikaria.dev` (main Minecraft server using BungeeCord proxy)
2. All records point to your server IP address (161.97.82.122)
3. DNS proxying is disabled (`false`) since Minecraft doesn't work well with Cloudflare proxying

## Important Notes

- Minecraft servers use a binary protocol that doesn't work through HTTP proxies
- The DNS records point directly to your server's IP address
- Your BungeeCord proxy will handle the routing between the two Minecraft servers
- Players will connect using the subdomain names (mc-niilo.ikaria.dev, mc-ilias.ikaria.dev, or mc.ikaria.dev)
- The main `mc.ikaria.dev` subdomain will route through your BungeeCord proxy to your backend servers

## Firewall and Port Configuration

Make sure your server allows connections on port 25565 for Minecraft traffic.