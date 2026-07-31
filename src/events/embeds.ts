import { EmbedBuilder } from 'discord.js';
import { WindowsEvent } from '../types/windows-event.js';

export const buildEmbed = (event: WindowsEvent) =>
  new EmbedBuilder().setTitle(event.provider).setDescription(event.message);
