import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import ping from './commands/ping.js';
import { registerReady } from './events/ready.js';
import { registerInteractionCreate } from './events/interactionCreate.js';
import type { Command } from './types/command.js';
import { getConfig } from './config.js';
import { ZabbixClient } from './services/zabbix.js';
import { AiClient } from './services/ai.js';
import { LogMonitor } from './services/logMonitor.js';
import { registerClientDiagnostics } from './events/clientDiagnostics.js';

const config = getConfig();
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>([[ping.data.name, ping]]);

const rest = new REST({ version: '10' }).setToken(config.discordToken);

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
  body: [ping.data.toJSON()],
});
console.log('Commands deployed.');
const monitor = new LogMonitor({
  client,
  zabbix: new ZabbixClient(config.zabbixUrl, config.zabbixToken, config.zabbixTimeoutMs),
  ai: new AiClient(config.aiUrl, config.aiToken, config.aiModel),
  itemId: config.zabbixItemId,
  channels: config.channels,
  intervalMs: config.pollIntervalMs,
  processExisting: config.processExisting,
});
registerReady(client, () => monitor.start());
registerInteractionCreate(client, commands);
registerClientDiagnostics(client);

await client.login(config.discordToken);
