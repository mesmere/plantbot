# plantbot 🌱 ![CI status](https://github.com/mesmere/plantbot/actions/workflows/ci.yml/badge.svg)

plantbot is a lightweight general-purpose moderation bot for Discord mod teams.

## Features

* Literally nothing. 🤪

## Deployment

*Requires: Docker*

1. Go to the [Discord developer portal](https://discord.com/developers/applications) and create a new bot. Make your new bot private (plantbot only works on a single guild at a time anyway) and give it the "message content" privileged intent. Finally, add it to your guild by going to the following URL (replace `YOUR_APPLICATION_ID` with the bot's actual application ID):

```
https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=8&scope=bot
```

2. Create a file named `.env` based on the example config ([`.env.example`](/.env.example)) and fill in values for **all** configuration options. You may need to create new channels and roles to populate some of the variables, e.g. a `#plantbot-logs` channel or an isolation role.

3. Run the following command in the same directory to launch a Docker container from the latest prebuilt image:

```sh
docker run -d --restart always --env-file .env ghcr.io/mesmere/plantbot:latest
```

## Docker build

GitHub will auto-build a multiarch Docker image for every commit pushed to `main`. If you'd prefer to build your own Docker image locally, there are targets provided in [the `justfile`](/justfile):

```sh
just docker-build
just docker-daemon
just docker-kill
```

## Development

*Requires: nodejs/npm of [the correct version](/.node-version) (use `nodenv` or `nvm`)*
*Optional: Python and a C++ toolchain to build native modules*

1. Create a bot following the same instructions as in [the deployment section](#Deployment).

2. Check out the plantbot source repository and set up your configuration:

```sh
git clone git@github.com:mesmere/plantbot.git && cd plantbot
cp .env.example .env
vi .env
```

3. Install dependencies and build native modules:

```sh
npm install
```

4. Start the server:

```sh
npm run start
```

The start script runs plantbot with nodemon so the server will restart automatically when the code changes.

## Troubleshooting

**Q. What if I'm trying to do development on Windows and can't build native modules? (node-gyp errors)**

**A.** Ideally install the needed tools on your system somehow in order to keep dev as close as possible to production. That being said, native modules are technically optional and the bot should still work if you remove the following dependencies - but **do not** commit your modified `package.json`:

* `bufferutil`
* `utf-8-validate`
* `zlib-sync`
