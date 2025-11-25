#!/bin/bash
export DOLLAR='$'
envsubst < /server/config.yml.template > /server/config.yml
exec /usr/bin/run-bungeecord.sh "$@"
