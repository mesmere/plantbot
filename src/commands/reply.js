import process from "node:process";
import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ModalBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Temporal } from "temporal-polyfill";
import logger from "#root/logs.js";

export default {
  spec: new ContextMenuCommandBuilder()
    .setName("Reply as staff")
    .setType(ApplicationCommandType.Message)
    .toJSON(),

  /** @param {MessageContextMenuCommandInteraction} interaction */
  async handle(interaction) {
    logger.debug(
      `${interaction.user.username} used 'reply' to message ${interaction.targetMessage.id} in #${interaction.channel.name}`
    );

    const uuid = crypto.randomUUID();
    const textInput = new TextInputBuilder()
      .setCustomId("messageInput")
      .setLabel("Reply")
      .setPlaceholder("Enter your reply here...")
      .setMinLength(1)
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    const actionRow = new ActionRowBuilder().addComponents(textInput);
    const modal = new ModalBuilder()
      .setCustomId(uuid)
      .setTitle("Reply as staff")
      .addComponents(actionRow);
    await interaction.showModal(modal);

    let response;
    try {
      // The original interaction token is valid for 15 minutes but we need a little time to finish up
      const timeout = Temporal.Duration.from({ minutes: 15 }).subtract({ seconds: 15 });
      response = await interaction.awaitModalSubmit({
        time: timeout.total("millisecond"),
        filter: i => i.customId === uuid,
      });
    } catch (e) {
      logger.debug(
        `${interaction.user.username} never submitted their reply to ${interaction.targetMessage.url}`
      );
    }

    if (response !== undefined) {
      const message = response.fields.getTextInputValue("messageInput");
      logger.debug(
        `${interaction.user.username} submitted the reply modal for ${interaction.targetMessage.url}:\n${message}`
      );

      // Send the reply in the original channel
      const replySendResult = await interaction.targetMessage.reply(message);
      await response.reply({ content: "Reply sent. 👍", ephemeral: true });
      setTimeout(
        () => response.deleteReply(),
        Temporal.Duration.from({ seconds: 2 }).total("millisecond")
      );

      // Send a log message in the log channel
      const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID);
      const prettyDate = Temporal.Instant.fromEpochMilliseconds(
        interaction.createdTimestamp
      ).toString({ smallestUnit: "second" });
      const thumbnailFile = new AttachmentBuilder("assets/speaking.png");
      const logMessageEmbed = new EmbedBuilder()
        .setDescription(`↪️ ${interaction.targetMessage.member}\n${message}`)
        .setAuthor({
          name: `@${interaction.user.username} (${interaction.user.id})`,
          url: replySendResult.url,
          iconURL: interaction.member.displayAvatarURL({ size: 128 }),
        })
        .setColor(interaction.member.displayColor)
        .setFooter({ text: `#${interaction.channel.name} • ${prettyDate}` })
        .setThumbnail("attachment://speaking.png");
      await logChannel.send({
        embeds: [logMessageEmbed],
        files: [thumbnailFile],
        allowedMentions: { parse: [] },
      });
    }
  },
};
