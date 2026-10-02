# Upgrading an existing database goes through 7.0 first, see docs/architecture.md#upgrading-mongo
ARG MONGO_VERSION=8.0
FROM mongo:${MONGO_VERSION}

COPY ./apps/db/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.override.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.override.sh"]
