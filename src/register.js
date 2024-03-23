import { makePayload } from "#root/commands.js";
import logger from "#root/logs.js";
import { REST, Routes } from "discord.js";
import process from "node:process";

const payload = makePayload();
logger.info(`Uploading ${payload.length} commands to guild ${process.env.GUILD_ID}...`);
logger.debug(`Commands payload:\n${JSON.stringify(payload, undefined, 2)}`);

const rest = new REST().setToken(process.env.TOKEN);
await rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID), {
  body: payload,
});

logger.info("Successfully uploaded commands.");
