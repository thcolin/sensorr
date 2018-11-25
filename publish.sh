#!env bash

[[ '' == $1 ]] && echo "Please provide version argument: x.x.x or 'latest'" && exit 1

docker build -t sensorr:$1 .
docker tag sensorr:$1 thcolin/sensorr:$1
docker push thcolin/sensorr:$1
