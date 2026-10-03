#!/bin/sh
# Installs Sensorr with Docker Compose: asks what docker-compose.yml needs, writes .env, starts the stack.
#
#   curl -fsSL https://raw.githubusercontent.com/thcolin/sensorr/dev/install.sh | sh
#
# Run again on an existing install, it keeps every value its .env already holds, asks only for the
# missing ones, then pulls and restarts the stack.
set -eu

REPOSITORY=https://raw.githubusercontent.com/thcolin/sensorr
IMAGE=ghcr.io/thcolin/sensorr-api

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

# Under `curl | sh`, stdin is the script itself: answers come from the terminal
( : </dev/tty ) 2>/dev/null || fail 'no terminal to ask from, run the installer from an interactive shell'
trap 'stty echo </dev/tty 2>/dev/null || true' EXIT
trap 'exit 130' INT TERM

ask() {
  if [ -n "$2" ]; then
    printf '? %s [%s]: ' "$1" "$2" >/dev/tty
  else
    printf '? %s: ' "$1" >/dev/tty
  fi
  IFS= read -r answer </dev/tty || answer=
  [ -n "$answer" ] || answer=$2
}

ask_hidden() {
  printf '? %s: ' "$1" >/dev/tty
  stty -echo </dev/tty
  IFS= read -r answer </dev/tty || answer=
  stty echo </dev/tty
  printf '\n' >/dev/tty
}

ask_folder() {
  while :; do
    ask "$1" "$2"
    case $answer in
      \~) answer=$HOME ;;
      \~/*) answer=$HOME/${answer#\~/} ;;
    esac
    case $answer in
      /*) quotable "$answer" && return ;;
      *) printf '  An absolute path, please\n' >/dev/tty ;;
    esac
  done
}

# .env values are written single-quoted, which compose reads literally, so `$` stays a `$`
quotable() {
  case $1 in
    *"'"*)
      printf "  No single quote, please\n" >/dev/tty
      return 1
      ;;
  esac
}

has() { grep -q "^$1=" .env; }

get() { sed -n "s/^$1=//p" .env | tr -d '\r' | tail -n 1 | sed "s/^'\(.*\)'$/\1/"; }

set_value() { printf "%s='%s'\n" "$1" "$2" >>.env; }

tag_of() { if [ "$1" = stable ]; then printf latest; else printf '%s' "$1"; fi; }

random() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; }

command -v docker >/dev/null 2>&1 || fail 'Docker is missing, install it first: https://docs.docker.com/engine/install/'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose is missing, install it first: https://docs.docker.com/compose/install/'
docker info >/dev/null 2>&1 || fail 'Docker does not answer: start it, or run the installer as a user allowed to use it'
command -v curl >/dev/null 2>&1 || fail 'curl is missing'

printf 'Sensorr installer\n\n'

ask_folder 'Install folder' "$HOME/.sensorr"
mkdir -p "$answer"
cd "$answer"

if [ -f .env ]; then
  printf 'Existing install found, its values are kept\n'
else
  (umask 077 && : >.env)
fi
# An .env edited by hand may end without a newline, the next key would land on its last line
[ -z "$(tail -c 1 .env)" ] || printf '\n' >>.env

if ! has SENSORR_TAG; then
  offered=
  for channel in stable beta dev; do
    if docker manifest inspect "$IMAGE:$(tag_of "$channel")" >/dev/null 2>&1; then
      offered="$offered${offered:+, }$channel"
    fi
  done
  [ -n "$offered" ] || fail "GHCR does not answer, no image of $IMAGE found"
  while :; do
    ask "Channel, $offered" "${offered%%,*}"
    case ", $offered," in
      *", $answer,"*) printf 'SENSORR_TAG=%s\n' "$(tag_of "$answer")" >>.env && break ;;
    esac
  done
fi

if ! has SENSORR_BLACKHOLE; then
  ask_folder 'Blackhole folder, where .torrent files go for your download client' "$PWD/blackhole"
  set_value SENSORR_BLACKHOLE "$answer"
fi

if ! has SENSORR_TVSHOWS; then
  ask_folder 'Shows folder, holding the shows library and its download folders' "$PWD/tvshows"
  set_value SENSORR_TVSHOWS "$answer"
fi

if ! has SENSORR_USERNAME; then
  while :; do
    ask 'Username' 'sensorr'
    quotable "$answer" && break
  done
  set_value SENSORR_USERNAME "$answer"
fi

if ! has SENSORR_PASSWORD; then
  while :; do
    ask_hidden 'Password [sensorr]'
    password=${answer:-sensorr}
    [ -n "$answer" ] || break
    quotable "$password" || continue
    ask_hidden 'Password, again'
    [ "$answer" = "$password" ] && break
    printf '  The passwords differ\n' >/dev/tty
  done
  set_value SENSORR_PASSWORD "$password"
fi

has SENSORR_AUTH_SECRET || set_value SENSORR_AUTH_SECRET "$(random)"
# The database keeps the password it was created with, compose's default when .env had none
if ! has SENSORR_DATABASE_PASSWORD; then
  if [ -n "$(ls -A db 2>/dev/null)" ]; then
    printf 'Existing database found, it keeps the default password\n'
    set_value SENSORR_DATABASE_PASSWORD sensorr
  else
    set_value SENSORR_DATABASE_PASSWORD "$(random)"
  fi
fi

if ! has TZ; then
  zone=$(readlink /etc/localtime 2>/dev/null | sed -n 's|.*zoneinfo/||p')
  [ -n "$zone" ] || zone=$(cat /etc/timezone 2>/dev/null || true)
  while :; do
    ask 'Time zone' "${zone:-UTC}"
    quotable "$answer" && break
  done
  set_value TZ "$answer"
fi

if ! has COMPOSE_PROFILES; then
  ask 'Update from Settings > Update? It gives sensorr-updater the Docker socket, y or n' 'y'
  case $answer in
    y | Y | yes) printf 'COMPOSE_PROFILES=updater\n' >>.env ;;
    *) printf 'COMPOSE_PROFILES=\n' >>.env ;;
  esac
fi

# A stable tag runs the compose file of main, the others the one of dev
case $(get SENSORR_TAG) in
  *-*) ref=dev ;;
  latest | [0-9]*) ref=main ;;
  *) ref=dev ;;
esac

curl -fsSL -o docker-compose.yml "$REPOSITORY/$ref/docker-compose.yml"
curl -fsSL --create-dirs -o docker/sensorr-db/0-init-mongodb.js "$REPOSITORY/$ref/docker/sensorr-db/0-init-mongodb.js"

if [ ! -f config.json ]; then
  curl -fsSL -o config.json.tmp "$REPOSITORY/$ref/config.default.json"
  while :; do
    ask 'TMDB API key (v3), from https://www.themoviedb.org/settings/api, empty to set it later in the app' ''
    key=$answer
    [ -n "$key" ] || break
    case $key in
      *[!A-Za-z0-9]*) status=401 ;;
      *) status=$(curl -s -o /dev/null --max-time 10 -w '%{http_code}' "https://api.themoviedb.org/3/configuration?api_key=$key" || true) ;;
    esac
    case $status in
      2??) break ;;
      401) printf '  TMDB refused this key\n' >/dev/tty ;;
      *) printf '  TMDB does not answer (HTTP %s), the key is kept unchecked\n' "$status" >/dev/tty && break ;;
    esac
  done
  [ -z "$key" ] || sed "s/\"tmdb-api-key\"/\"$key\"/" config.json.tmp >config.json
  [ -f config.json ] || mv config.json.tmp config.json
  rm -f config.json.tmp
fi

# Docker on a Synology refuses to start on a missing mount
mkdir -p caddy/data caddy/config caddy/certs db .secrets "$(get SENSORR_BLACKHOLE)" "$(get SENSORR_TVSHOWS)"

docker compose pull
docker compose up -d

port=$(docker compose port sensorr-web 80 | sed 's/.*://')
[ -n "$port" ] || fail 'sensorr-web publishes no port, see docker compose ps'
printf 'Waiting for Sensorr to answer'
tries=0
while :; do
  status=$(printf '%s' "$(get SENSORR_PASSWORD)" | curl -s --max-time 5 -o /dev/null -w '%{http_code}' \
    --data-urlencode "username=$(get SENSORR_USERNAME)" --data-urlencode 'password@-' \
    "http://localhost:$port/api/auth" || true)
  case $status in
    2??) break ;;
    401) printf '\n' && fail 'Sensorr refused the login of .env' ;;
  esac
  tries=$((tries + 1))
  [ "$tries" -lt 100 ] || { printf '\n' && fail "Sensorr did not answer in 5 minutes, last HTTP status $status, see docker compose logs sensorr-api"; }
  printf '.'
  sleep 3
done

printf '\n\nSensorr runs in %s\n' "$PWD"
printf '  http://%s:%s\n' "$(hostname)" "$port"
printf '  https://%s:%s\n' "$(hostname)" "$(docker compose port sensorr-web 443 | sed 's/.*://')"
printf 'Log in with the username and password you chose.\n'
