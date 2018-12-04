FROM keymetrics/pm2:latest-alpine

WORKDIR /app/sensorr

VOLUME /app/sensorr/config
VOLUME /app/sensorr/blackhole

ENV NPM_CONFIG_LOGLEVEL warn

COPY .babelrc index.js package.json ecosystem.config.js webpack.*.js ./
COPY config.docker.json config.default.json
COPY bin ./bin
COPY shared ./shared
COPY src ./src

RUN mkdir -p blackhole \
  && chmod 666 blackhole \
  && mkdir -p bin/db \
  && chmod 660 bin/db \
  && mkdir -p db \
  && chmod 660 db \
  && apk add -U python make g++ \
  && npm install \
  && npm run build \
  && apk del python make g++ \
  && rm -rf /var/cache/apk/*

EXPOSE 5070

CMD [ "npm", "run", "prod" ]
