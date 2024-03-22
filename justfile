install:
  npm install --no-audit --no-fund

test: install
  npm run test

lint: install
  npm run lint

format: install
  npm run format

start: install
  npm run start

docker-build:
  sudo docker buildx build -t mesmere/plantbot:latest .

docker-run:
  sudo docker run --rm --env-file .env mesmere/plantbot

docker-daemon:
  sudo docker run -d --restart always --env-file .env mesmere/plantbot

docker-kill:
  sudo docker ps -qf ancestor=mesmere/plantbot | xargs --no-run-if-empty sudo docker kill --signal SIGTERM
