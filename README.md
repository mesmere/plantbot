# plantbot 🌱 ![CI status](https://github.com/mesmere/plantbot/actions/workflows/ci.yml/badge.svg)

plantbot is a lightweight general-purpose moderation bot for Discord mod teams.

## Features

* 🗣️ `/say` messages anonymously, making mod team actions less personal!
* 🤐 `/isolate` a problem user to a single channel so that they can't delete their message history!
* 🚦 Control `/slowmode` without giving junior staff full delete-channel permissions!
* 📎 Download all of a channel's `/attachments` in bulk!
* 🕵️ `/impersonate` any member so that you can moderate from an alt account!
* 💬 Set plantbot's rich presence `/status`!
* 🔎 Actions are logged to an audit channel for admin review.

## Production deployment

*Requirements: Docker.*

1. Create a new bot in the [Discord developer portal](https://discord.com/developers/applications). Make your bot private and give it the "message content" and "server members" privileged intents. Finally, add it to your guild:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR-APPLICATION-ID&permissions=8&scope=bot
   ```

   Be sure to replace `YOUR-APPLICATION-ID` with your actual application ID from the Bot tab of the developer portal.

   Discord automatically creates a bot role for plantbot, but it puts this new role at the bottom of the role list. This means that plantbot will be unable to take moderator action against any user with _any role_. Drag the plantbot role up to the top of the role list.

2. Create a file named `.env` based on the example config [`.env.example`](/.env.example), and fill in values for all of the configuration options. You may need to create new channels and roles in order to populate some of the variables, like a `#plantbot-logs` channel or an isolation role.

3. Run the following to launch plantbot using the latest prebuilt Docker image:

   ```sh
   docker run -d --restart always --env-file .env ghcr.io/mesmere/plantbot:latest
   ```

   plantbot logs to stdout, which is picked up by Docker. Production logs should be small but you may still want to [configure a proper logging driver](https://docs.docker.com/config/containers/logging/configure/) so that logs don't accumulate in a single json file forever.

## Docker local build

*Requirements: Docker, [`docker-buildx`](https://github.com/docker/buildx), [`just`](https://github.com/casey/just).*

GitHub builds a multiarch Docker image for every commit merged to `main`. If you'd prefer to build and run your own image locally, there are targets provided in the [`justfile`](/justfile):

```sh
just docker-build
just docker-daemon
just docker-kill
```

## Development

*Requirements: Node.js + npm (use `nodenv` to install [the correct version](/.node-version)).*  
*Optional: Python to run pre-commit hooks.*  
*Optional: Python and a C++ toolchain to build native modules.*

1. Create a bot following the same instructions as in [the deployment section](#production-deployment).

2. Check out the plantbot source repository and copy `.env.example` to `.env`:

   ```sh
   git clone git@github.com:mesmere/plantbot.git && cd plantbot
   cp .env.example .env
   ```

   Make sure you set values for all of the configuration variables in your `.env` file.

3. Install dependencies and build native modules:

   ```sh
   npm install
   ```

4. Register plantbot's command specs with Discord so that they can be pushed out to clients:

   ```sh
   npm run register
   ```

   The `register` step is performed automatically on startup when running [in production](https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production), but for development the process is manual to give you additional control over how you spend your **200 command-creations per guild per day** rate limit. You can re-run the `register` script any time that you want to push a modified command spec from [`/src/commands/`](/src/commands).

5. Start the server:

   ```sh
   npm start
   ```

   This runs plantbot with [nodemon](https://github.com/remy/nodemon) so the server will restart automatically when the code changes.

### Pre-commit hooks

Husky sets up git pre-commit hooks which will stop you from committing anything that doesn't pass eslint and prettier checks. You should install/enable plugins for those in your editor, but you can also fix issues manually:

* `npx eslint --fix src/`
* `npx prettier src/ --write`

Passing these checks is required to merge a PR. Still, remember that you can always bypass pre-commit hooks locally with `git commit --no-verify`.

## Troubleshooting

**Q. Why do I get permission errors (`DiscordAPIError[50013]`) when trying to `/isolate` a member?**

**A.** Discord initially adds plantbot's bot role to the bottom of your guild's role list. Even though the role has administrator permissions, it still can't add or remove roles higher than itself in the role list. This should probably be considered a bug in Discord's permissions model, but you can work around it by just reordering the roles so that plantbot is near the top.

**Q. What if I'm trying to do development on Windows and can't build native modules (`node-gyp` errors) or can't run the pre-commit hooks (`git-format-staged` errors)?**

**A.** Native modules are optional and the bot should still work locally if you remove the following dependencies - but _do not_ commit your modified `package.json`:

* `bufferutil`
* `utf-8-validate`
* `zlib-sync`

You should install Python to get pre-commit hooks working but as a last resort you can permanently disable them locally by removing the `"prepare": "husky"` entry from your `package.json` and running:

```sh
git config --unset core.hooksPath
```
