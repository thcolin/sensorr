# Sensorr

# Install

```sh
# Choose an install folder for Sensorr install and config files
mkdir ~/.sensorr && cd ~/.sensorr

# Download install files
curl -o docker-compose.yml https://raw.githubusercontent.com/thcolin/sensorr/dev/docker-compose.yml
curl -o config.json https://raw.githubusercontent.com/thcolin/sensorr/dev/config.default.json

# Configure Sensorr
echo "SENSORR_AUTH_SECRET=youshouldchangethisvaluetoanythingelse" >> .env
echo "SENSORR_USERNAME=username" >> .env
echo "SENSORR_PASSWORD=password" >> .env
echo "SENSORR_DATABASE_PASSWORD=anotherpassword" >> .env

# Define your "blackhole" path where .torrent files will be downloaded
echo "SENSORR_BLACKHOLE=/home/user/downloads" >> .env

# Set your own TimeZone, see ["TZ identifier"](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List)
echo "TZ=Europe/Paris" >> .env

# Launch the stack
docker compose up -d

# Sensorr is now available at,
# * http://localhost:5070
# * https://localhost:5071
# Use previously defined username/password to login
```

## HTTPS

Use custom key/cert for HTTPS (default to [`tls internal { on_demand }`](https://caddyserver.com/docs/automatic-https#on-demand-tls))

```sh
echo "CADDY_TLS_MODE=custom" >> .env
echo "SENSORR_SSL_KEY=/path/to/domain.key" >> .env
echo "SENSORR_SSL_CERT=/path/to/domain.cert" >> .env
```

## Configuration

When you edit manually your `config.json`, you need to restart `sensorr-sensorr-api-1` container to apply your changes

```sh
docker container restart sensorr-api
```

# Update

To update Sensorr you need to take down the stack, pull updated images and start the stack back

```sh
cd ~/.sensorr
docker compose down --remove-orphans
docker compose pull sensorr/sensorr-web
docker compose pull sensorr/sensorr-api
docker compose up -d
```

