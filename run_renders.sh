#!/bin/bash

# Function to generate config and render
render_map() {
    SERVER_NAME="$1"
    WORLD_PATH="$2"
    OUTPUT_NAME="$3"
    TITLE="$4"

    echo "Starting render for $TITLE ($SERVER_NAME from $WORLD_PATH)..."
    
    # Ensure output directory exists
    mkdir -p /data/output/$OUTPUT_NAME

    # Create config file
    cat > /tmp/config_$SERVER_NAME.py <<CONFIG
outputdir = "/data/output/$OUTPUT_NAME"
worlds["$SERVER_NAME"] = "$WORLD_PATH"

renders["day"] = {
    "world": "$SERVER_NAME",
    "title": "Day",
    "rendermode": "smooth_lighting",
    "dimension": "overworld",
}
CONFIG

    # Run overviewer
    python3 /app/overviewer.py --config /tmp/config_$SERVER_NAME.py --processes 2
}

# Render all mc-* projects that have world data mounted into overviewer
render_map "mc-ilias" "/data/worlds/mc-ilias/world" "ilias" "Ikaria Games"
render_map "mc-niilo" "/data/worlds/mc-niilo/world" "niilo" "Königreich"
render_map "mc-bgstpoelten" "/data/worlds/mc-bgstpoelten/world" "bgstpoelten" "BGST St. Pölten"
render_map "mc-htlstp" "/data/worlds/mc-htlstp/world" "htlstp" "HTL St. Pölten"
render_map "mc-borgstpoelten" "/data/worlds/mc-borgstpoelten/world" "borgstpoelten" "BORG St. Pölten"
render_map "mc-hakstpoelten" "/data/worlds/mc-hakstpoelten/world" "hakstpoelten" "HAK St. Pölten"
render_map "mc-basop-bafep-stp" "/data/worlds/mc-basop-bafep-stp/world" "basop-bafep-stp" "BASOP/BAFEP St. Pölten"
render_map "mc-play" "/data/worlds/mc-play/world" "play" "Play Server"

echo "All renders finished."
