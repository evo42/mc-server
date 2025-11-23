#!/bin/bash

# Deployment script for Minecraft Server Setup
echo "Minecraft Server Deployment Script"
echo "=================================="

# Configuration
SERVER_HOST="root@mc.ikaria.dev"
REMOTE_DIR="/opt/minecraft-server"
BACKUP_DIR="/opt/minecraft-server-backup-$(date +%Y%m%d_%H%M%S)"

echo "Deploying to: $SERVER_HOST"
echo "Remote directory: $REMOTE_DIR"
echo "Backup directory (if needed): $BACKUP_DIR"

# Create backup of existing setup if it exists
echo "Checking for existing installation..."
if ssh -o ConnectTimeout=10 "$SERVER_HOST" "test -d $REMOTE_DIR" 2>/dev/null; then
    echo "Creating backup of existing installation..."
    ssh "$SERVER_HOST" "cp -r $REMOTE_DIR $BACKUP_DIR"
    if [ $? -eq 0 ]; then
        echo "✓ Backup created: $BACKUP_DIR"
    else
        echo "✗ Failed to create backup"
        exit 1
    fi
else
    echo "No existing installation found, proceeding with fresh deployment"
fi

# Create directory structure on remote server
echo "Creating remote directory structure..."
ssh "$SERVER_HOST" "mkdir -p $REMOTE_DIR/mc-ilias/datapacks $REMOTE_DIR/mc-niilo/datapacks $REMOTE_DIR/bungeecord/config $REMOTE_DIR/admin-ui $REMOTE_DIR/minecraft-base $REMOTE_DIR/nginx-proxy"

# Copy all required files to the server
echo "Copying files to remote server..."

# Copy docker-compose files
scp docker-compose.yml "$SERVER_HOST:$REMOTE_DIR/"
scp docker-compose-full.yml "$SERVER_HOST:$REMOTE_DIR/"

# Copy Minecraft base files
scp minecraft-base/Dockerfile "$SERVER_HOST:$REMOTE_DIR/minecraft-base/"
scp minecraft-base/start-server.sh "$SERVER_HOST:$REMOTE_DIR/minecraft-base/"

# Copy BungeeCord files
scp bungeecord/Dockerfile "$SERVER_HOST:$REMOTE_DIR/bungeecord/"
scp bungeecord/config.yml "$SERVER_HOST:$REMOTE_DIR/bungeecord/"
scp bungeecord/start-bungee.sh "$SERVER_HOST:$REMOTE_DIR/bungeecord/"
scp bungeecord/config/config.yml "$SERVER_HOST:$REMOTE_DIR/bungeecord/config/" 2>/dev/null || echo "No pre-existing BungeeCord config to copy"

# Copy admin UI files
scp admin-ui/Dockerfile "$SERVER_HOST:$REMOTE_DIR/admin-ui/"
scp admin-ui/server.js "$SERVER_HOST:$REMOTE_DIR/admin-ui/"
scp admin-ui/index.html "$SERVER_HOST:$REMOTE_DIR/admin-ui/"
scp admin-ui/admin.html "$SERVER_HOST:$REMOTE_DIR/admin-ui/"
scp admin-ui/package.json "$SERVER_HOST:$REMOTE_DIR/admin-ui/"

# Copy datapacks (if they exist locally)
# Note: The datapacks were created in earlier steps and should be preserved if already deployed

# Copy nginx proxy files
scp nginx-proxy/docker-compose.yml "$SERVER_HOST:$REMOTE_DIR/nginx-proxy/"

# Copy documentation
scp readme.md "$SERVER_HOST:$REMOTE_DIR/" 2>/dev/null || echo "No readme.md file"
scp datapack-installation.md "$SERVER_HOST:$REMOTE_DIR/" 2>/dev/null || echo "No datapack-installation.md file"

# Copy Cloudflare DNS setup files
scp setup-cloudflare-dns.sh "$SERVER_HOST:$REMOTE_DIR/"
scp setup-cloudflare-dns-readme.md "$SERVER_HOST:$REMOTE_DIR/"

echo "Setting up environment on remote server..."

# Install Docker and Docker Compose if not already installed
ssh "$SERVER_HOST" << 'EOF'
set -e

# Update system packages
apt-get update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
else
    echo "Docker is already installed"
fi

# Verify Docker is working
docker version

# Change to the deployment directory
cd /opt/minecraft-server

# Install Node.js for the admin UI if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
fi

# Install admin UI dependencies
cd /opt/minecraft-server/admin-ui
npm install

# Make scripts executable
chmod +x /opt/minecraft-server/setup-cloudflare-dns.sh
chmod +x /opt/minecraft-server/bungeecord/start-bungee.sh
chmod +x /opt/minecraft-server/minecraft-base/start-server.sh

echo "Setup completed successfully!"
EOF

if [ $? -eq 0 ]; then
    echo "✓ Server environment setup completed"
else
    echo "✗ Server environment setup failed"
    exit 1
fi

echo ""
echo "Deployment Summary:"
echo "- Files copied to $REMOTE_DIR on $SERVER_HOST"
echo "- Docker and dependencies installed (if needed)"
echo "- Node.js dependencies installed for admin UI"
echo "- All required services configured"

echo ""
echo "Next steps:"
echo "1. SSH to the server: ssh $SERVER_HOST"
echo "2. Navigate to the directory: cd $REMOTE_DIR"
echo "3. Start the services: docker-compose -f docker-compose-full.yml up -d"
echo "4. To set up DNS: export CF_API_TOKEN='your_token' && ./setup-cloudflare-dns.sh"
echo ""
echo "The Minecraft servers will be accessible via:"
echo "- mc.ikaria.dev (main entry through BungeeCord)"
echo "- mc-niilo.ikaria.dev (direct access to mc-niilo)"
echo "- mc-ilias.ikaria.dev (direct access to mc-ilias)"
echo ""
echo "The admin UI will be accessible at: http://your-server-ip:3000"
echo "Default credentials: admin / admin123 (change in environment variables if needed)"