import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const LOG_TYPES = [
  'Database.Log',
  'Cheating.Log',
  'Subastas.Log',
  'Bans.log',
  'MonetizationCreditosPatreon.log',
  'MonetizationShopTransactions.log',
  'MonetizationShopErrors.log',
  'EdicionPaquete.log',
  'MacroServidor.log',
  'MacroCliente.log',
  'Propiedades.log',
  'Eventos.log',
  'EjercitoReal.Log',
  'EjercitoCaos.Log',
  'Errores.log',
  'Performance.log',
  'obtenemos.log',
  'Clans.log',
  'BankTransfers.log',
  'Premios.log',
  'GM.log',
] as const;

export type LogType = (typeof LOG_TYPES)[number];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

export function getConfig() {
  const optionalTypes = new Set<LogType>([
    'Bans.log',
    'MacroServidor.log',
    'MacroCliente.log',
    'Propiedades.log',
    'Premios.log',
    'GM.log',
  ]);
  const channels = Object.fromEntries(
    LOG_TYPES.map((type) => {
      const name = `DISCORD_LOG_CHANNEL_${type.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
      return [type, optionalTypes.has(type) ? (process.env[name] ?? '') : required(name)];
    }),
  ) as Record<LogType, string>;

  return {
    discordToken: required('DISCORD_BOT_TOKEN'),
    clientId: required('CLIENT_ID'),
    guildId: required('GUILD_ID'),
    zabbixUrl: process.env.ZABBIX_URL ?? 'https://zabbix.ao20.com.ar/zabbix/api_jsonrpc.php',
    zabbixToken: required('ZABBIX_API_TOKEN'),
    zabbixItemId: process.env.ZABBIX_ITEM_ID ?? '46595',
    zabbixTimeoutMs: positiveNumber('ZABBIX_REQUEST_TIMEOUT_MS', 10_000),
    processExisting: process.env.ZABBIX_PROCESS_EXISTING_LOGS !== 'false',
    pollIntervalMs: positiveNumber('ZABBIX_POLL_INTERVAL_MS', 15_000),
    aiUrl: process.env.AI_URL ?? 'https://llm.lucasrecoaro.com.ar/v1/chat/completions',
    aiToken: process.env.AI_TOKEN,
    aiModel: process.env.AI_MODEL ?? 'default',
    channels,
  };
}
