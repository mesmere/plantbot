import process from "node:process";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Temporal } from "temporal-polyfill";
import logger from "#root/logs.js";

export default {
  spec: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set the channel's slowmode")
    .addIntegerOption(o =>
      o
        .setName("timeout")
        .setDescription("Timeout in seconds (0 to disable)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(Temporal.Duration.from({ hours: 6 }).total("seconds"))
    )
    .addStringOption(o =>
      o
        .setName("reason")
        .setDescription("Note to add to the audit log")
        .setRequired(false)
        .setMaxLength(512)
    )
    .toJSON(),

  async handle(interaction) {
    const timeout = interaction.options.getInteger("timeout");
    const reason = interaction.options.getString("reason");
    logger.debug(
      `${interaction.user.username} used 'slowmode' in ${interaction.channel.name}: <${timeout}, ${reason}>`
    );

    // Set the slowmode timeout
    await interaction.channel.setRateLimitPerUser(timeout, reason || undefined);
    await interaction.reply({ content: "Slowmode set. 👍", ephemeral: true });
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
    const prettyDescription =
      timeout === 0 ? "Disabled slowmode." : `Set slowmode to ${timeout} seconds.`;
    const logMessageEmbed = new EmbedBuilder()
      .setDescription(reason ? `${prettyDescription}\nReason: ${reason}` : prettyDescription)
      .setAuthor({
        name: `@${interaction.user.username} (${interaction.user.id})`,
        iconURL: interaction.member.displayAvatarURL({ size: 128 }),
      })
      .setFooter({
        text: `#${interaction.channel.name} • ${prettyDate}`,
      });
    await logChannel.send({ embeds: [logMessageEmbed], allowedMentions: { parse: [] } });
  },
};
