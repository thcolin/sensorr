FROM node:16-alpine as builder

WORKDIR /app

RUN npm install yarn -g --force

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .

ENV NODE_ENV=production
ENV NX_REJECT_UNKNOWN_LOCAL_CACHE=0
RUN yarn build web --prod

FROM caddy:2.6.4 As production

COPY docker/sensorr-web/Caddyfile /etc/caddy/Caddyfile
COPY docker/sensorr-web/sslmode /srv/sslmode
COPY --from=builder /app/dist/apps/web /srv
