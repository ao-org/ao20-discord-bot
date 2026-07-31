import 'dotenv/config';

import { Client, Collection, GatewayIntentBits } from 'discord.js';

import ping from './commands/ping.js';

import { registerReady } from './events/ready.js';
import { registerInteractionCreate } from './events/interactionCreate.js';

import { subscribe } from './eventlog/subscribe.js';

import type { Command } from './types/command.js';
import { processEvent } from './events/processEvent.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>([[ping.data.name, ping]]);

registerReady(client);
registerInteractionCreate(client, commands);

await client.login(process.env.TOKEN);

subscribe('Application', processEvent(client));

console.log('Windows Event Log subscriptions started.');
