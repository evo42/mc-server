FROM eclipse-temurin:8-jre-alpine

# Install wget
RUN apk add --no-cache wget

# Create bungee user
RUN adduser -D -s /bin/sh bungee

# Create server directory and set permissions
RUN mkdir -p /home/bungee/server && chown -R bungee:bungee /home/bungee
WORKDIR /home/bungee/server

# Download BungeeCord
RUN wget -O BungeeCord.jar https://ci.md-5.net/job/BungeeCord/lastSuccessfulBuild/artifact/bootstrap/target/BungeeCord.jar

# Create necessary directories
RUN mkdir -p plugins

# Copy default config
COPY config.yml /home/bungee/config.yml

# Set up startup script
COPY start-bungee.sh /home/bungee/start-bungee.sh
RUN chmod +x /home/bungee/start-bungee.sh

# Expose Minecraft proxy port
EXPOSE 25565

# Switch to bungee user
USER bungee

# Default command
CMD ["/home/bungee/start-bungee.sh"]