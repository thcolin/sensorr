#!/bin/bash

if [ ! -f /opt/keyfile/mongodb-keyfile ]; then
  openssl rand -base64 756 > /opt/keyfile/mongodb-keyfile
  echo "Generate mongodb keyfile for replica set usage"
fi

chmod 600 /opt/keyfile/mongodb-keyfile
chown 999:999 /opt/keyfile/mongodb-keyfile

exec /usr/local/bin/docker-entrypoint.sh --replSet rs0 --bind_ip_all --keyFile /opt/keyfile/mongodb-keyfile
