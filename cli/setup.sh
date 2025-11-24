#!/bin/bash

# Consolidated Setup Script for Minecraft SaaS Platform

set -e

# --- HELPERS ---

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

print_status() {
    echo -e \"${GREEN}[INFO]${NC} $1\"
}

print_warn() {
    echo -e \"${YELLOW}[WARN]${NC} $1\"
}

print_error() {
    echo -e \"${RED}[ERROR]${NC} $1\"
}

# --- SETUP FUNCTIONS ---

setup_cloudflare() {
    print_status \"Setting up Cloudflare DNS...\"
    
    ZONE_ID=\"5bfda71acbd55cf4edd5a108ad66710a\"
    ACCOUNT_ID=\"b477bdfbe601c1077004973902aa628d\"
    DOMAIN=\"ikaria.dev\"
    SERVER_IP=\"161.97.82.122\"

    if [ -z \"$CF_API_TOKEN\" ]; then
        print_error \"CF_API_TOKEN environment variable is not set\"
        exit 1
    fi

    create_dns_record() {
        local name=$1
        local type=$2
        local content=$3
        local proxied=$4
        
        response=$(curl -s -X POST \"https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records\" \\
            -H \"Authorization: Bearer $CF_API_TOKEN\" \\
            -H \"Content-Type: application/json\" \\
            --data \"{\\\"type\\\":\\\"$type\\\",\\\"name\\\":\\\"$name.$DOMAIN\\\",\\\"content\\\":\\\"$content\\\",\\\"ttl\\\":1,\\\"proxied\\\":$proxied}\")
        
        if echo \"$response\" | grep -q '\"success\":true'; then
            print_status \"DNS record created successfully: $name.$DOMAIN\"
        else
            print_error \"Failed to create DNS record: $name.$DOMAIN\"
        fi
    }

    delete_existing_record() {
        local name=$1
        local type=$2
        
        record_id=$(curl -s -X GET \"https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$type&name=$name.$DOMAIN\" \\
            -H \"Authorization: Bearer $CF_API_TOKEN\" | \\
            python3 -c \"import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id']) if data['result'] else print('')\")
        
        if [ ! -z \"$record_id\" ]; then
            curl -s -X DELETE \"https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$record_id\" \\
                -H \"Authorization: Bearer $CF_API_TOKEN\" > /dev/null
            print_status \"Deleted existing DNS record for $name.$DOMAIN\"
        fi
    }

    delete_existing_record \"mc-niilo\" \"A\"
    delete_existing_record \"mc-ilias\" \"A\"
    delete_existing_record \"mc\" \"A\"

    create_dns_record \"mc-niilo\" \"A\" \"$SERVER_IP\" \"false\"
    create_dns_record \"mc-ilias\" \"A\" \"$SERVER_IP\" \"false\"
    create_dns_record \"mc\" \"A\" \"$SERVER_IP\" \"false\"

    print_status \"Cloudflare DNS setup complete.\"
}

setup_cron() {
    print_status \"Setting up cron job for backups...\"
    
    SCRIPT_DIR=\"$( cd \\\"$( dirname \\\"${BASH_SOURCE[0]}\\\" )\\\" &> /dev/null && pwd )\"
    COMMAND_TO_RUN=\"cd ${SCRIPT_DIR}/.. && ./cli/backup.sh\"
    CRON_JOB=\"0 0 * * * ${COMMAND_TO_RUN}\"

    EXISTING_CRONTAB=$(crontab -l || true)
    if echo \"${EXISTING_CRONTAB}\" | grep -qF -- \"${COMMAND_TO_RUN}\"; then
        print_status \"Backup cron job already exists.\"
    else
        (crontab -l 2>/dev/null; echo \"${CRON_JOB}\") | crontab -
        print_status \"Cron job for backups created successfully.\"
    fi
}

setup_master() {
    print_status \"Starting master setup...\"
    ./cli/build.sh
    ./cli/deploy.sh
    ./cli/deploy.sh verify
    print_status \"Master setup complete.\"
}

# --- MAIN LOGIC ---

help() {
    echo \"Usage: $0 [command]\"
    echo \"\"
    echo \"Commands:\"
    echo \"  master     - Run the full master setup (default)\"
    echo \"  cloudflare - Setup Cloudflare DNS records\"
    echo \"  cron       - Setup the cron job for backups\"
    echo \"  help       - Show this help message\"
}

ACTION=${1:-master}

case $ACTION in
    \"master\")
        setup_master
        ;;
    \"cloudflare\")
        setup_cloudflare
        ;;
    \"cron\")
        setup_cron
        ;;
    \"help\")
        help
        ;;
    *)
        print_error \"Unknown command: $ACTION\"
        help
        exit 1
        ;;
esac
