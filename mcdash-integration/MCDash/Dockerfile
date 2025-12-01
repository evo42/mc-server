# Multi-stage Docker build for MCDash Integration
FROM maven:3.9-eclipse-temurin-11 AS build-stage

# Set working directory
WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY pom.xml .
RUN mvn dependency:resolve

# Copy source code
COPY src ./src
COPY webui ./webui

# Build the application
# RUN mvn clean package -DskipTests

# Production stage - Updated to Java 11
FROM eclipse-temurin:11-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl wget

WORKDIR /app

# Install a simple web server
RUN apk add --no-cache python3

# Copy the Python HTTP server
COPY server.py /app/server.py

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the Python web server
CMD ["python3", "/app/server.py"]
