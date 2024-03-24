import process from "node:process";
import { SlashCommandBuilder, EmbedBuilder, ActivityType } from "discord.js";
import { Temporal } from "temporal-polyfill";
import logger from "#root/logs.js";

export default {
  spec: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Update plantbot's status")
    .addIntegerOption(o =>
      o
        .setName("type")
        .setDescription("Type of activity")
        .setRequired(true)
        .setChoices(
          { name: "Competing in", value: ActivityType.Competing },
          { name: "Listening to", value: ActivityType.Listening },
          { name: "Playing", value: ActivityType.Playing },
          { name: "Streaming", value: ActivityType.Streaming },
          { name: "Watching", value: ActivityType.Watching }
        )
    )
    .addStringOption(o =>
      o
        .setName("activity")
        .setDescription("Activity detail")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(128)
    )
    .toJSON(),

  async handle(interaction) {
    const type = interaction.options.getInteger("type");
    const activity = interaction.options.getString("activity");
    logger.debug(
      `${interaction.user.username} used 'status': <${ActivityType[type]}, ${activity}>`
    );

    // Set the bot user's presence activity
    await interaction.client.user.setActivity(activity, { type });
    await interaction.reply({ content: "Status set. 👍", ephemeral: true });
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
      .setDescription(
        `Updated plantbot's status.\n- Type: ${ActivityType[type]}\n- Activity: ${activity}`
      )
      .setAuthor({
        name: `@${interaction.user.username} (${interaction.user.id})`,
        iconURL: interaction.member.displayAvatarURL({ size: 128 }),
      })
      .setFooter({
        text: prettyDate,
      });
    await logChannel.send({ embeds: [logMessageEmbed], allowedMentions: { parse: [] } });
  },
};
