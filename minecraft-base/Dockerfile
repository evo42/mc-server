ARG MC_VERSION=1.21
FROM eclipse-temurin:21-jdk-focal

RUN apt-get update && apt-get install -y wget

ARG MC_VERSION
RUN wget https://api.papermc.io/v2/projects/paper/versions/${MC_VERSION}/builds/1/downloads/paper-${MC_VERSION}-1.jar -O /server.jar

WORKDIR /data

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 25565
ENTRYPOINT ["/entrypoint.sh"]
