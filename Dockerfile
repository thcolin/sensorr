FROM keymetrics/pm2:latest-alpine

WORKDIR /app/sensorr

VOLUME /app/sensorr/config
VOLUME /app/sensorr/blackhole

ENV NPM_CONFIG_LOGLEVEL warn

COPY .babelrc package.json package-lock.json ecosystem.config.js webpack.*.js ./
COPY config.docker.json config.default.json
COPY bin ./bin
COPY server ./server
COPY shared ./shared
COPY src ./src

RUN mkdir -p blackhole \
  && chmod 666 blackhole \
  && mkdir -p config \
  && chmod 660 config \
  && mkdir -p config/.db \
  && chmod 660 config/.db \
  && mkdir -p config/.sessions \
  && chmod 660 config/.sessions \
  && apk add -U python make g++ \
  && npm install \
  && npm run build \
  && apk del python make g++ \
  && rm -rf /var/cache/apk/*

EXPOSE 5070

CMD [ "npm", "run", "prod" ]
