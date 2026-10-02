FROM node:26-alpine AS builder

WORKDIR /app

RUN npm install yarn -g --force

COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
RUN yarn install

ENV NODE_ENV=production
ENV NX_REJECT_UNKNOWN_LOCAL_CACHE=0
RUN find . -type f -name '*.spec.ts' -delete
RUN yarn build api --prod
RUN yarn --cwd ./dist/apps/api install
RUN yarn build cli --prod
RUN yarn --cwd ./dist/apps/cli install

USER node

FROM node:26-alpine AS production

ARG SENSORR_REVISION
ENV NX_SENSORR_REVISION=$SENSORR_REVISION

WORKDIR /app

COPY --chown=node:node ./apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/bin ./bin
RUN npm install -g web-push

ENTRYPOINT ["/app/docker-entrypoint.sh"]
