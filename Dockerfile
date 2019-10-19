FROM keymetrics/pm2:latest-alpine

WORKDIR /app/sensorr

VOLUME /app/sensorr/config
VOLUME /app/sensorr/blackhole

COPY .babelrc package.json yarn.lock ecosystem.config.js webpack.*.js ./
COPY config.docker.json config.default.json
COPY bin ./bin
COPY server ./server
COPY shared ./shared
COPY src ./src

RUN mkdir -p config \
  && chmod 666 config \
  && cp config.default.json config/config.json \
  && mkdir -p blackhole \
  && chmod 660 blackhole \
  && apk add -U python make g++ \
  && npm i -g yarn \
  && yarn install \
  && yarn run build \
  && apk del python make g++ \
  && rm -rf /var/cache/apk/*

EXPOSE 5070

CMD [ "yarn", "run", "prod" ]
