# Use Docker official image
FROM docker:dind

# Install dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    curl

# Set working directory
WORKDIR /app

# Install node packages for Docker API proxy
RUN npm init -y && \
    npm install express dockerode cors helmet

# Create a non-root user
RUN adduser -D docker-proxy -u 1001

# Create necessary directories
RUN mkdir -p /app /var/run/docker.sock

# Copy the proxy application
COPY docker-proxy-server.js /app/

# Change ownership
RUN chown -R docker-proxy:docker-proxy /app

# Switch to non-root user
USER docker-proxy

# Expose the proxy port
EXPOSE 3001

# Start the Docker proxy
CMD ["dockerd", "&", "node", "/app/docker-proxy-server.js"]