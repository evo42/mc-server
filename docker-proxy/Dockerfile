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

# Create a non-root user (currently unused for running the process)
RUN adduser -D docker-proxy -u 1001

# Copy the proxy application
COPY docker-proxy-server.js /app/

# Change ownership
RUN chown -R docker-proxy:docker-proxy /app

# Expose the proxy port
EXPOSE 3001

# Start only the Node.js Docker proxy API.
# We rely on the host Docker daemon via the mounted /var/run/docker.sock,
# so we do NOT start dockerd inside this container to avoid rootless dockerd issues.
CMD ["node", "/app/docker-proxy-server.js"]
