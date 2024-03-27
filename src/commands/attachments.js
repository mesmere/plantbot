import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } from "discord.js";
import JSZip from "jszip";
import logger from "#root/logs.js";

const MAX_MESSAGES_TO_FETCH = 10000;
const MAX_BYTES_TO_DOWNLOAD = 25 * 2 ** 20; // Filesize limit for level 0 guilds

export default {
  spec: new SlashCommandBuilder()
    .setName("attachments")
    .setDescription("Dump message attachments in bulk")
    .addStringOption(o =>
      o
        .setName("after")
        .setDescription("Dump attachments after this message ID")
        .setRequired(true)
        .setMinLength(15)
        .setMaxLength(20)
    )
    .toJSON(),

  /** @param {ChatInputCommandInteraction} interaction */
  async handle(interaction) {
    let afterId = interaction.options.getString("after");
    logger.debug(`${interaction.user.username} used 'attachments' in #${interaction.channel.name}`);
    await interaction.deferReply();

    // Fetch messages from the channel looking for attachments
    let messageBatch;
    let messagesFetchedCount = 0;
    let attachmentsCount = 0;
    let bytesSeen = 0;
    let attachments = {};
    while (
      bytesSeen <= MAX_BYTES_TO_DOWNLOAD &&
      messagesFetchedCount <= MAX_MESSAGES_TO_FETCH &&
      (messageBatch = await interaction.channel.messages.fetch({ after: afterId, limit: 100 })).size
    ) {
      logger.debug(`Got message batch starting after ${afterId}...`);
      messagesFetchedCount += messageBatch.size;
      const messageBatchSorted = [...messageBatch.values()].sort((a, b) => a.id - b.id);
      for (const message of messageBatchSorted) {
        bytesSeen += [...message.attachments.values()].reduce((acc, cur) => acc + cur.size, 0);
        if (bytesSeen <= MAX_BYTES_TO_DOWNLOAD) {
          afterId = message.id;
          if (message.attachments.size) {
            attachmentsCount += message.attachments.size;
            attachments[message.id] = [...message.attachments.values()];
          }
        }
      }
    }

    // Download the attachments and insert them into an in-memory zip file
    const zip = new JSZip();
    for (const [messageId, messageAttachments] of Object.entries(attachments)) {
      const folder = zip.folder(messageId);
      logger.debug(
        `Downloading ${messageAttachments.length} attachment(s) for message ${messageId}...`
      );
      for (const attachment of messageAttachments) {
        const response = await fetch(attachment.url);
        folder.file(attachment.name, await response.arrayBuffer());
      }
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Upload the zip file as an attachment in our interaction reply
    let content;
    if (bytesSeen > MAX_BYTES_TO_DOWNLOAD) {
      const url = interaction.channel.messages.resolve(afterId).url;
      content = `I dumped ${attachmentsCount} attachments but hit the limit of ${MAX_BYTES_TO_DOWNLOAD} bytes and gave up at [message ${afterId}](${url}).`;
    } else if (messagesFetchedCount > MAX_MESSAGES_TO_FETCH) {
      const url = interaction.channel.messages.resolve(afterId).url;
      content = `I dumped ${attachmentsCount} attachments but hit the limit of ${MAX_MESSAGES_TO_FETCH} messages and gave up at [message ${afterId}](${url}).`;
    } else {
      content = `Successfully dumped ${attachmentsCount} attachments.`;
    }
    const file = new AttachmentBuilder(zipBuffer, { name: "attachments.zip" });
    await interaction.editReply({ content, files: [file] });
  },
};
