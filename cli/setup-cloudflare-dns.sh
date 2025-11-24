#!/bin/bash

# Cloudflare configuration
ZONE_ID="5bfda71acbd55cf4edd5a108ad66710a"
ACCOUNT_ID="b477bdfbe601c1077004973902aa628d"
DOMAIN="ikaria.dev"
SERVER_IP="161.97.82.122"  # Provided server IP

# Check if CF_API_TOKEN is set
if [ -z "$CF_API_TOKEN" ]; then
    echo "Error: CF_API_TOKEN environment variable is not set"
    exit 1
fi

echo "Using provided server IP address: $SERVER_IP"

# Function to create DNS record
create_dns_record() {
    local name=$1
    local type=$2
    local content=$3
    local proxied=$4  # true or false
    
    echo "Creating DNS record: $name.$DOMAIN -> $content (type: $type, proxied: $proxied)"
    
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"$type\",
            \"name\": \"$name.$DOMAIN\",
            \"content\": \"$content\",
            \"ttl\": 1,
            \"proxied\": $proxied
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✓ DNS record created successfully: $name.$DOMAIN"
    else
        echo "✗ Failed to create DNS record: $name.$DOMAIN"
        echo "Response: $response"
        return 1
    fi
}

# Function to delete existing DNS records if they exist
delete_existing_record() {
    local name=$1
    local type=$2
    
    # Get existing record ID if it exists
    record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$type&name=$name.$DOMAIN" \
        -H "Authorization: Bearer $CF_API_TOKEN" | \
        python3 -c "import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id']) if data['result'] else print('')")
    
    if [ ! -z "$record_id" ] && [ "$record_id" != "" ]; then
        echo "Deleting existing DNS record for $name.$DOMAIN (ID: $record_id)"
        response=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CF_API_TOKEN")
            
        if echo "$response" | grep -q '"success":true'; then
            echo "✓ Existing DNS record deleted successfully: $name.$DOMAIN"
        else
            echo "✗ Failed to delete existing DNS record: $name.$DOMAIN"
            echo "Response: $response"
        fi
    fi
}

# For Minecraft servers, we need A records pointing to the server IP
# Since these are Minecraft servers running on port 25565, we'll create A records
# Note: DNS cannot route to specific ports, so players will connect with the subdomain

# Delete existing records first (if any)
delete_existing_record "mc-niilo" "A"
delete_existing_record "mc-ilias" "A"
delete_existing_record "mc" "A"  # For the main mc.ikaria.dev

# Create new DNS records
echo "Creating DNS records for Minecraft servers..."
create_dns_record "mc-niilo" "A" "$SERVER_IP" "false"
create_dns_record "mc-ilias" "A" "$SERVER_IP" "false"
create_dns_record "mc" "A" "$SERVER_IP" "false"  # Main Minecraft server using BungeeCord

echo ""
echo "DNS records created successfully!"
echo ""
echo "Server details:"
echo "- mc-niilo.ikaria.dev -> $SERVER_IP"
echo "- mc-ilias.ikaria.dev -> $SERVER_IP"
echo "- mc.ikaria.dev -> $SERVER_IP"
echo ""
echo "Note: Players will connect using the subdomain names"
echo "The BungeeCord proxy will handle routing to the appropriate backend server."
echo "mc.ikaria.dev is the main entry point through the BungeeCord proxy."