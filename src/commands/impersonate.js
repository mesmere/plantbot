import process from "node:process";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { Temporal } from "temporal-polyfill";
import logger from "#root/logs.js";

const MAX_WEBHOOKS_PER_CHANNEL = 25;

export default {
  spec: new SlashCommandBuilder()
    .setName("impersonate")
    .setDescription("Send a message as another server member")
    .addUserOption(o => o.setName("member").setDescription("Member to send from").setRequired(true))
    .addStringOption(o =>
      o.setName("message").setDescription("Message to send").setMaxLength(2000).setRequired(true)
    )
    .toJSON(),

  /** @param {ChatInputCommandInteraction} interaction */
  async handle(interaction) {
    const member = interaction.options.getMember("member");
    const message = interaction.options.getString("message");
    logger.debug(
      `${interaction.user.username} used 'impersonate' of ${member.user.username} in #${interaction.channel.name}:\n${message}`
    );

    // Pre-validate the impersonated name instead of waiting to get smacked by the Discord API
    const lowerDisplayName = member.displayName.toLowerCase();
    if (lowerDisplayName.includes("clyde") || lowerDisplayName.includes("discord")) {
      logger.debug(`Can't impersonate a Discord account (${member.displayName})`);
      await interaction.reply({
        content: 'You can\'t impersonate a member with a name containing "clyde" or "discord".',
        ephemeral: true,
      });
      return;
    }

    // Get or create the impersonate webhook
    const webhooks = await interaction.channel.fetchWebhooks();
    let impersonateWebhook = webhooks.find(
      v => v.owner.id === process.env.APPLICATION_ID && v.name === "impersonate"
    );
    if (!impersonateWebhook) {
      if (webhooks.size + 1 > MAX_WEBHOOKS_PER_CHANNEL) {
        logger.error(
          `Can't create the impersonate webhook in #${interaction.channel.name} because it already has too many webhooks.`
        );
        await interaction.reply({
          content: "This channel already has too many webhooks.",
          ephemeral: true,
        });
        return;
      }
      logger.debug(`Creating the impersonate webhook in #${interaction.channel.name}...`);
      impersonateWebhook = await interaction.channel.createWebhook({ name: "impersonate" });
    }

    // Send the message in the triggering channel
    const messageSendResult = await impersonateWebhook.send({
      content: message,
      username: member.displayName,
      avatarURL: member.displayAvatarURL(),
    });
    await interaction.reply({ content: "Message sent. 👍", ephemeral: true });
    setTimeout(
      () => interaction.deleteReply(),
      Temporal.Duration.from({ seconds: 2 }).total("millisecond")
    );

    // Send a log message in the log channel
    const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID);
    const prettyDate = Temporal.Instant.fromEpochMilliseconds(
      interaction.createdTimestamp
    ).toString({
      smallestUnit: "second",
    });
    const thumbnailFile = new AttachmentBuilder("assets/spy.png");
    const logMessageEmbed = new EmbedBuilder()
      .setDescription(`Impersonating ${member.user.username}:\n${message}`)
      .setAuthor({
        name: `@${interaction.user.username} (${interaction.user.id})`,
        url: messageSendResult.url,
        iconURL: interaction.member.displayAvatarURL({ size: 128 }),
      })
      .setColor(interaction.member.displayColor)
      .setFooter({ text: `#${interaction.channel.name} • ${prettyDate}` })
      .setThumbnail("attachment://spy.png");
    await logChannel.send({
      embeds: [logMessageEmbed],
      files: [thumbnailFile],
      allowedMentions: { parse: [] },
    });
  },
};
