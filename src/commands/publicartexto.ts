import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

const STAFF_ROLE_NAME = 'Staff';
const NEWS_CHANNEL_ID = '1570162557203906600';

export default {
  data: new SlashCommandBuilder()
    .setName('publicartexto')
    .setDescription('Publica un texto en el canal de noticias')
    .addStringOption((option) =>
      option
        .setName('texto')
        .setDescription('El texto que querés publicar')
        .setMaxLength(2000)
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Este comando solo se puede usar dentro del servidor.',
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.some((role) => role.name === STAFF_ROLE_NAME)) {
      await interaction.reply({
        content: 'Solo integrantes del rol Staff pueden publicar noticias.',
        ephemeral: true,
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(NEWS_CHANNEL_ID);
    if (!channel?.isSendable()) {
      throw new Error(`News channel ${NEWS_CHANNEL_ID} is missing or not sendable.`);
    }

    const text = interaction.options.getString('texto', true);
    await channel.send({ content: text, allowedMentions: { parse: [] } });
    await interaction.reply({
      content: `Tu texto se publicó en <#${NEWS_CHANNEL_ID}>.`,
      ephemeral: true,
    });
  },
} satisfies Command;
