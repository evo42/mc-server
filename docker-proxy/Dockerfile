FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN npm init -y && \
    npm install express dockerode cors helmet express-rate-limit

COPY docker-proxy-server.js /app/

RUN adduser -D docker-proxy -u 1001 && \
    chown -R docker-proxy:docker-proxy /app

USER docker-proxy

EXPOSE 3001

<<<<<<< HEAD
# Start only the Node.js Docker proxy API.
# We rely on the host Docker daemon via the mounted /var/run/docker.sock,
# so we do NOT start dockerd inside this container to avoid rootless dockerd issues.
ENTRYPOINT ["node", "/app/docker-proxy-server.js"]
=======
CMD ["node", "/app/docker-proxy-server.js"]
>>>>>>> 81a751b (render maps as webpage)
