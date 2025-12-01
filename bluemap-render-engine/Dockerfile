# BlueMap Render Engine Dockerfile
FROM eclipse-temurin:17-jdk

# Install curl for health checks
RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Download BlueMap JAR
RUN curl -L -o bluemap.jar https://github.com/BlueMap-Minecraft/BlueMap/releases/download/v3.4.0/blueMap-3.4.0.jar

# Create directories for data
RUN mkdir -p /data/worlds
RUN mkdir -p /data/cache
RUN mkdir -p /data/logs
RUN mkdir -p /data/config

# Copy configuration templates
COPY config/ /data/config/

# Set Java options
ENV JAVA_MAX_MEMORY=2G
ENV JAVA_MIN_MEMORY=1G
ENV JAVA_GC_OPTS=-XX:+UseG1GC

# Expose monitoring port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8088/health || exit 1

# Start BlueMap render engine
CMD java $JAVA_OPTS -jar bluemap.jar --config=/data/config/bluemap.conf