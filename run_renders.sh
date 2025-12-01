#!/bin/bash
set -e

# Function to generate config and render
render_map() {
    SERVER_NAME=""
    WORLD_PATH=""
    OUTPUT_NAME=""
    TITLE=""

    echo "Starting render for  ( from )..."
    
    mkdir -p /data/output/

    cat > /tmp/config_.py <<CONFIG
outputdir = "/data/output/"
texturepath = "/minecraft-assets"
worlds[""] = ""

renders["day"] = {
    "world": "",
    "title": "Day",
    "rendermode": "smooth_lighting",
    "dimension": "overworld",
}
CONFIG

    python3 /app/overviewer.py --config /tmp/config_.py --processes 2
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
