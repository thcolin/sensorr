FROM keymetrics/pm2:latest-alpine

RUN apk add python make g++

WORKDIR /app/sensorr
VOLUME /app/sensorr/config
VOLUME /app/sensorr/blackhole
RUN mkdir -p blackhole
RUN chmod 666 blackhole

COPY bin bin/
COPY shared shared/
COPY src src/
COPY .babelrc ./
COPY config.docker.json config.default.json
COPY index.js ./
COPY package.json ./
COPY ecosystem.config.js ./
COPY webpack.*.js ./

# Bundle Application
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm run build
RUN mkdir -p bin/db
RUN chmod 660 bin/db
RUN mkdir -p db
RUN chmod 660 db

# Expose the listening port
EXPOSE 5070

# Show current folder structure in logs
# RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
