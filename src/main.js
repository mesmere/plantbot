import process from "node:process";
import { Client, Events, GatewayIntentBits } from "discord.js";
import commands, { makePayload as makeCommandsPayload } from "#root/commands.js";
import logger from "#root/logs.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Needed to resolve names/permissions for channels/roles
    GatewayIntentBits.GuildMembers, // Needed to keep cached guild members up to date
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async readyClient => {
  logger.info(`Client ready as ${readyClient.user.tag}`);

  if (process.env.NODE_ENV === "production") {
    logger.info("Production environment detected. Automatically pushing commands");
    const commandsPayload = makeCommandsPayload();
    logger.info(`Uploading ${commandsPayload.length} commands to guild ${process.env.GUILD_ID}...`);
    logger.debug(`Commands payload:\n${JSON.stringify(commandsPayload, undefined, 2)}`);

    try {
      const guild = await readyClient.guilds.fetch(process.env.GUILD_ID);
      if (!guild.available) {
        throw new Error("Guild not available. Is there a server outage?");
      }
      await guild.commands.set(commandsPayload);
      logger.info("Successfully uploaded commands");
    } catch (e) {
      throw new Error("Failed to upload commands", { cause: e });
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) {
    return;
  }

  const command = commands[interaction.commandName];
  if (command === undefined) {
    logger.error(
      `Got a ${interaction.commandType} interaction for the command '${interaction.commandName}' but there is no registered handler`
    );
    return;
  }

  const staffRoleIds = process.env.STAFF_ROLE_IDS.split(",");
  if (!interaction.member.roles.cache.hasAny(...staffRoleIds)) {
    logger.debug(
      `Non-staff user ${interaction.user.username} (${interaction.user.id}) tried to use ${interaction.commandName}`
    );
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      await interaction.reply({
        content: "You must be a staff member to use plantbot commands.",
        ephemeral: true,
      });
    }
    return;
  }

  try {
    await command.handle(interaction);
  } catch (e) {
    throw new Error(`Failed to handle interaction for command '${interaction.commandName}'`, {
      cause: e,
    });
  }
});

process.on("SIGINT", exit);
process.on("SIGTERM", exit);
async function exit(signal) {
  logger.info(`Received ${signal} - exiting...`);
  await client.destroy();
  process.exit();
}

client.login(process.env.TOKEN);
