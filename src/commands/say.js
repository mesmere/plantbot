import process from "node:process";
import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { Temporal } from "temporal-polyfill";
import logger from "#root/logs.js";

export default {
  spec: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send a message anonymously")
    .addStringOption(o =>
      o.setName("message").setDescription("Message to send").setMaxLength(2000).setRequired(true)
    )
    .toJSON(),

  /** @param {ChatInputCommandInteraction} interaction */
  async handle(interaction) {
    const message = interaction.options.getString("message");
    logger.debug(
      `${interaction.user.username} used 'say' in ${interaction.channel.name}:\n${message}`
    );

    // Send the message in the channel the command was used in
    const messageSendResult = await interaction.channel.send(message);
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
    const logMessageEmbed = new EmbedBuilder()
      .setDescription(message)
      .setAuthor({
        name: `@${interaction.user.username} (${interaction.user.id})`,
        url: messageSendResult.url,
        iconURL: interaction.member.displayAvatarURL({ size: 128 }),
      })
      .setFooter({
        text: `#${interaction.channel.name} • ${prettyDate}`,
      });
    await logChannel.send({ embeds: [logMessageEmbed], allowedMentions: { parse: [] } });
  },
};
