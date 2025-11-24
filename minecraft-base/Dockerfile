# Use a more recent base image with Java 21
FROM eclipse-temurin:21-jdk-jammy

# Install required tools
RUN apt-get update && \
    apt-get install -y wget curl jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create user for security
RUN groupadd -r minecraft && useradd -r -g minecraft minecraft

# Environment variables with defaults
ENV EULA=FALSE \
    VERSION=1.21.1 \
    TYPE=PAPER \
    MEMORY=4G \
    MAX_MEMORY=8G \
    ONLINE_MODE=true \
    MOTD="A Minecraft Server" \
    SERVER_DIR=/data

# Create server directory
RUN mkdir -p $SERVER_DIR && \
    chown -R minecraft:minecraft $SERVER_DIR

VOLUME ["/data"]

WORKDIR /app

# Script to download and select the correct build for a given version
COPY download-server.sh /app/download-server.sh
RUN chmod +x /app/download-server.sh

# Download the server jar based on environment variables
RUN ./download-server.sh

# Copy start script
COPY start-server.sh /app/start-server.sh
RUN chmod +x /app/start-server.sh

EXPOSE 25565

USER minecraft

CMD ["/app/start-server.sh"]
