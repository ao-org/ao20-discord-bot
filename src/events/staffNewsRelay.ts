import { Client, Events } from 'discord.js';

const STAFF_ROLE_NAME = 'Staff';
const NEWS_CHANNEL_ID = '1570162557203906600';

export function registerStaffNewsRelay(
  client: Client,
  guildId: string,
  sourceChannelId: string,
) {
  client.on(Events.MessageCreate, async (message) => {
    if (
      !message.inGuild() ||
      message.guildId !== guildId ||
      message.channelId !== sourceChannelId ||
      message.channelId === NEWS_CHANNEL_ID ||
      message.author.bot
    ) {
      return;
    }

    if (!message.member?.roles.cache.some((role) => role.name === STAFF_ROLE_NAME)) return;

    try {
      const channel = await message.guild.channels.fetch(NEWS_CHANNEL_ID);
      if (!channel?.isSendable()) {
        console.error(`News channel ${NEWS_CHANNEL_ID} is missing or not sendable.`);
        return;
      }

      await channel.send({
        content: message.content || undefined,
        embeds: message.embeds.map((embed) => embed.toJSON()),
        files: message.attachments.map((attachment) => ({
          attachment: attachment.url,
          name: attachment.name ?? undefined,
        })),
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error(`Failed to relay Staff message ${message.id}.`, error);
    }
  });
}
