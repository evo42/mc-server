#!/bin/bash

# --- HELPERS ---

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons for output
ICON_SUCCESS="✔"
ICON_ERROR="✖"
ICON_WARN="⚠"
ICON_INFO="ℹ"

# --- LOGGING FUNCTIONS ---

log_info() {
    echo -e "${GREEN}${ICON_INFO}${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}${ICON_WARN}${NC} $1"
}

log_error() {
    echo -e "${RED}${ICON_ERROR}${NC} $1"
}

log_success() {
    echo -e "${GREEN}${ICON_SUCCESS}${NC} $1"
}

# --- HEADINGS ---

print_heading() {
    echo -e "${BLUE}--- $1 ---${NC}"
}
