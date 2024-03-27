import process from "node:process";
import {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  OverwriteType,
  PermissionFlagsBits,
} from "discord.js";
import { Temporal } from "temporal-polyfill";
import randomstring from "randomstring";
import logger from "#root/logs.js";

export default {
  spec: new SlashCommandBuilder()
    .setName("isolate")
    .setDescription("Remove a member's access to all channels")
    .addUserOption(o => o.setName("member").setDescription("Member to isolate").setRequired(true))
    .addStringOption(o =>
      o
        .setName("reason")
        .setDescription("Note to add to the audit log")
        .setRequired(false)
        .setMaxLength(512)
    )
    .toJSON(),

  /** @param {ChatInputCommandInteraction} interaction */
  async handle(interaction) {
    const member = interaction.options.getMember("member");
    const reason = interaction.options.getString("reason");
    logger.debug(
      `${interaction.user.username} used 'isolate' on ${member.user.username}: ${reason}`
    );

    // Ack the command to show a progress indicator because this handler isn't super fast
    await interaction.deferReply({ ephemeral: true });

    // Update the member's roles
    const rolesToTake = process.env.ISO_TAKE_ROLE_IDS.split(",").filter(x => x);
    const rolesToGive = process.env.ISO_GIVE_ROLE_IDS.split(",").filter(x => x);
    const currentRoles = [...member.roles.cache.keys()];
    const newRoles = currentRoles.filter(k => !rolesToTake.includes(k)).concat(rolesToGive);
    await member.roles.set([...new Set(newRoles)], reason);

    // Create an isolation channel
    const staffRoleIds = process.env.STAFF_ROLE_IDS.split(",").filter(x => x);
    const permissionOverwrites = [
      {
        // @everyone
        id: interaction.guild.id,
        type: OverwriteType.Role,
        deny: PermissionFlagsBits.ViewChannel,
      },
      {
        id: member.user.id,
        type: OverwriteType.Member,
        allow: PermissionFlagsBits.ViewChannel,
      },
      ...staffRoleIds.map(id => ({
        id,
        type: OverwriteType.Role,
        allow: PermissionFlagsBits.ViewChannel,
      })),
    ];
    const isoChannel = await interaction.guild.channels.create({
      name: `iso-${member.user.username}-${randomstring.generate(3)}`,
      type: ChannelType.GuildText,
      parent: process.env.MOD_CHANNELS_CATEGORY_ID,
      permissionOverwrites,
      reason,
    });
    isoChannel.send(
      `${member} Please wait here. **This is not a ban** but we need some space to figure out what's going on without ` +
        `people editing/deleting their messages. Take a break for now while staff works on resolving this.`
    );

    // Send log messages
    interaction.editReply(
      `Isolated ${member}. To undo isolation, manually fix their roles and delete the ${isoChannel} channel.`
    );
    const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID);
    const prettyDate = Temporal.Instant.fromEpochMilliseconds(
      interaction.createdTimestamp
    ).toString({ smallestUnit: "second" });
    const description = `${member} was isolated to ${isoChannel}.`;
    const thumbnailFile = new AttachmentBuilder("assets/zipper-mouth.png");
    const logMessageEmbed = new EmbedBuilder()
      .setTitle(`${member.user.username} isolated!`)
      .setDescription(reason ? `${description}\nReason: ${reason}` : description)
      .setAuthor({
        name: `@${interaction.user.username} (${interaction.user.id})`,
        iconURL: interaction.member.displayAvatarURL({ size: 128 }),
      })
      .setFooter({ text: prettyDate })
      .setThumbnail("attachment://stop-sign.png");
    await logChannel.send({
      embeds: [logMessageEmbed],
      files: [thumbnailFile],
      allowedMentions: { parse: [] },
    });
  },
};
