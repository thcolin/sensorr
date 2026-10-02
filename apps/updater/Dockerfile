FROM node:26-alpine

RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app
COPY apps/updater/src/main.mjs ./main.mjs

CMD ["node", "/app/main.mjs"]
