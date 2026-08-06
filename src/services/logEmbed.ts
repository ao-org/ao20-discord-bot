import { EmbedBuilder } from 'discord.js';
import type { LogType } from '../config.js';
import type { ZabbixHistory } from './zabbix.js';

const colors: Record<string, number> = {
  'Errores.log': 0xed4245,
  'Database.Log': 0xed4245,
  'Cheating.Log': 0xf1c40f,
  'MonetizationShopErrors.log': 0xe67e22,
  'Performance.log': 0x9b59b6,
  'GM.log': 0x3498db,
};

export function createLogEmbed(type: LogType, event: ZabbixHistory, summary?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(colors[type] ?? 0x5865f2)
    .setTitle(`Argentum 20 · ${type}`)
    .setDescription(event.value.slice(0, 4096))
    .setTimestamp(Number(event.clock) * 1000)
    .setFooter({ text: `Zabbix item ${event.itemid}` });
  if (summary) embed.addFields({ name: 'Resumen IA', value: summary.slice(0, 1024) });
  return embed;
}
