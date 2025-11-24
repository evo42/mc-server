FROM itzg/minecraft-server:latest

# Create directories for mc-ilias specific configurations
RUN mkdir -p /data/datapacks

VOLUME ["/data"]

EXPOSE 25565

# Set up entrypoint script
COPY start-server.sh /start-server.sh
RUN chmod +x /start-server.sh

CMD ["/start-server.sh"]