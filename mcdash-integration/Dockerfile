# Multi-stage Docker build for MCDash Integration
FROM maven:3.8.6-openjdk-8-slim AS build-stage

# Set working directory
WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY /Users/rene/ikaria/MCDash/pom.xml .
RUN mvn dependency:resolve

# Copy source code
COPY /Users/rene/ikaria/MCDash/src ./src
COPY /Users/rene/ikaria/MCDash/webui ./webui

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM openjdk:8-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy built JAR file
COPY --from=build-stage /app/target/MCDash-*.jar ./mcdash.jar

# Copy web UI build
COPY --from=build-stage /app/webui/dist ./webui

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start application
CMD ["java", "-jar", "mcdash.jar"]