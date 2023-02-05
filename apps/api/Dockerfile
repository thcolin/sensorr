FROM node:16-alpine As builder

WORKDIR /app

RUN npm install yarn -g --force

COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
RUN yarn install --ignore-optional

ENV NODE_ENV=production
RUN find . -type f -name '*.spec.ts' -delete
RUN yarn build api --prod --generatePackageJson
RUN yarn --cwd ./dist/apps/api install
RUN yarn build cli --prod --generatePackageJson
RUN yarn --cwd ./dist/apps/cli install
RUN yarn --cwd ./dist/apps/cli add tslib@^2.0.0

USER node

FROM node:16-alpine As production

WORKDIR /app

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/bin ./bin

CMD ["node", "dist/apps/api/main.js"]
