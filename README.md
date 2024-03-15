# plantbot ![CI status](https://github.com/mesmere/plantbot/actions/workflows/ci.yml/badge.svg)

plantbot is a lightweight general-purpose moderation bot for Discord mod teams.

## Features

* Literally nothing. 🤪

## Deployment

1. Go to the [Discord developer portal](https://discord.com/developers/applications) and create a bot.

2. Create a file named `.env` based on the example ([`.env.example`](/.env.example)) and fill in values for **all** configuration options, including the auth token that you just got from the developer portal.

3. Run this command to launch a Docker container based on the latest prebuilt image:

```sh
docker run -d --restart always --env-file .env ghcr.io/mesmere/plantbot:latest
```

If you'd prefer to build your own Docker image, there are targets provided in the [`justfile`](/justfile):

```sh
git clone --depth 1 https://github.com/mesmere/plantbot.git && cd plantbot
cp .env.example .env
vi .env # Fill in configuration
just docker-build
just docker-daemon
```

## Development

1. Go to the [Discord developer portal](https://discord.com/developers/applications) and create a bot.

2. Check out the plantbot source repository and set up your configuration:

```sh
git clone git@github.com:mesmere/plantbot.git && cd plantbot
cp .env.example .env
vi .env
```

3. Install dependencies and build native modules (this requires Python _and_ a C++ compiler):

```sh
npm install
```

4. Start the server:

```sh
npm run start
```

This starts plantbot with nodemon so that the server will restart automatically if you edit `.env` or anything in `src/`.
