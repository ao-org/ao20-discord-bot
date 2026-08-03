import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const LOG_TYPES = [
  'Database.Log',
  'Cheating.Log',
  'Subastas.Log',
  'MonetizationCreditosPatreon.log',
  'MonetizationShopTransactions.log',
  'MonetizationShopErrors.log',
  'EdicionPaquete.log',
  'Eventos.log',
  'EjercitoReal.Log',
  'EjercitoCaos.Log',
  'Errores.log',
  'Performance.log',
  'obtenemos.log',
  'Clans.log',
  'BankTransfers.log',
] as const;

export type LogType = (typeof LOG_TYPES)[number];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getConfig() {
  const channels = Object.fromEntries(
    LOG_TYPES.map((type) => [type, required(`DISCORD_LOG_CHANNEL_${type.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`)]),
  ) as Record<LogType, string>;

  return {
    discordToken: required('DISCORD_BOT_TOKEN'),
    clientId: required('CLIENT_ID'),
    guildId: required('GUILD_ID'),
    zabbixUrl: process.env.ZABBIX_URL ?? 'https://zabbix.ao20.com.ar/zabbix/api_jsonrpc.php',
    zabbixToken: required('ZABBIX_API_TOKEN'),
    zabbixItemId: process.env.ZABBIX_ITEM_ID ?? '46595',
    pollIntervalMs: Number(process.env.ZABBIX_POLL_INTERVAL_MS ?? 15000),
    aiUrl: process.env.AI_URL ?? 'https://llm.lucasrecoaro.com.ar/v1/chat/completions',
    aiToken: process.env.AI_TOKEN,
    aiModel: process.env.AI_MODEL ?? 'default',
    channels,
  };
}
