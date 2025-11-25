FROM itzg/bungeecord
USER root
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
