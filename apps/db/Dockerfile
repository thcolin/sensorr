FROM mongo:6.0.6

COPY ./apps/db/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.override.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.override.sh"]
