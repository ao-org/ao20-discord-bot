import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import ping from './commands/ping.js';
import { registerReady } from './events/ready.js';
import { registerInteractionCreate } from './events/interactionCreate.js';
import type { Command } from './types/command.js';
import { startEventSubscription } from './eventViewer/streamParser.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>([[ping.data.name, ping]]);

registerReady(client);
registerInteractionCreate(client, commands);

await client.login(process.env.TOKEN);
startEventSubscription();

console.log('Windows Event Log subscriptions started.');
