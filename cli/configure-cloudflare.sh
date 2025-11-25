#!/bin/bash

set -e

# Load Cloudflare credentials
source .secrets

# Your domain and server IP
DOMAIN="lerncraft.xyz"
SERVER_IP="161.97.82.122"

# List of subdomains
SUBDOMAINS=(
    "play"
    "bgstpoelten"
    "htlstp"
    "borgstpoelten"
    "hakstpoelten"
    "basop-bafep-stp"
)

# Function to create a DNS record
create_dns_record() {
    local name=$1
    local type="A"
    local content=$2
    local proxied="false"

    # Check if record already exists
    record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=$type&name=$name.$DOMAIN" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id'] if data['result'] else '')")

    if [ ! -z "$record_id" ]; then
        echo "DNS record for $name.$DOMAIN already exists. Skipping."
        return
    fi

    # Create the DNS record
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"type":"'"$type"'","name":"'"$name"'","content":"'"$content"'","proxied":'"$proxied"'}')

    if echo "$response" | grep -q '"success":true'; then
        echo "Successfully created DNS record for $name.$DOMAIN"
    else
        echo "Failed to create DNS record for $name.$DOMAIN"
        echo "Response: $response"
    fi
}

# Create A record for the root domain
create_dns_record "@" "$SERVER_IP"

# Create A records for subdomains
for subdomain in "${SUBDOMAINS[@]}"; do
    create_dns_record "$subdomain" "$SERVER_IP"
done

echo "Cloudflare DNS configuration complete."
