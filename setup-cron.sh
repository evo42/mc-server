#!/bin/bash
#
# setup-cron.sh
#
# Sets up a daily cron job to run the backup.sh script.

set -euo pipefail

# Define the command to be run.
# Using a subshell to cd into the script's directory ensures that
# the backup script runs from the correct project root.
SCRIPT_DIR="$( cd \"$( dirname \"${BASH_SOURCE[0]}\" )\" &> /dev/null && pwd )"
COMMAND_TO_RUN="cd ${SCRIPT_DIR} && ./backup.sh"

# Cron job definition (runs every day at midnight).
CRON_JOB="0 0 * * * ${COMMAND_TO_RUN}"

echo "▶ Setting up daily backup cron job..."

# Check if the cron job already exists to avoid duplicates.
# We pipe the existing crontab to a grep search. The `|| true` prevents
# the script from exiting if grep finds no matches.
EXISTING_CRONTAB=$(crontab -l || true)
if echo \"${EXISTING_CRONTAB}\" | grep -qF -- \"${COMMAND_TO_RUN}\"; then
    echo "✔ Backup cron job already exists. No action needed."
else
    echo "  - Adding new cron job to run daily at midnight."
    # Appends the new cron job to the existing crontab.
    (crontab -l 2>/dev/null; echo \"${CRON_JOB}\") | crontab -
    echo "✔ Cron job successfully added."
fi

echo "To view your current cron jobs, run: crontab -l"

exit 0
