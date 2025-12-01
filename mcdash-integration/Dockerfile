# Multi-stage Docker build for MCDash Integration
FROM maven:3.9-eclipse-temurin-11 AS build-stage

# Set working directory
WORKDIR /app

# Copy pom.xml and resolve dependencies
# Note: In production, these would come from actual MCDash source
# COPY ${MCDASH_PATH:-./mcdash-source}/pom.xml .
# RUN mvn dependency:resolve

# Copy source code
# COPY ${MCDASH_PATH:-./mcdash-source}/src ./src
# COPY ${MCDASH_PATH:-./mcdash-source}/webui ./webui

# For demo purposes, create a simple JAR placeholder
RUN echo "Creating demo MCDash JAR for monitoring setup" > /app/demo.txt

# Build the application
# RUN mvn clean package -DskipTests

# Production stage - Updated to Java 11
FROM eclipse-temurin:11-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl wget

WORKDIR /app

# For demo purposes, create a simple echo service that responds to health checks
RUN echo '#!/bin/sh\n\
echo "HTTP/1.1 200 OK"\necho "Content-Type: application/json"\necho ""\necho \'{"status": "ok", "version": "demo-mcdash"}\'\n\
' > /app/server.sh && chmod +x /app/server.sh

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start demo service (in production this would be: CMD ["java", "-jar", "mcdash.jar"])
CMD ["sh", "/app/server.sh"]