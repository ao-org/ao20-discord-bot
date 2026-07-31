import 'dotenv/config';

import { Client, Collection, GatewayIntentBits } from 'discord.js';

import ping from './commands/ping.js';

import { registerInteractionCreate } from './events/interactionCreate.js';
import { registerReady } from './events/ready.js';

import type { Command } from './types/command.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>();

commands.set(ping.data.name, ping);

registerReady(client);
registerInteractionCreate(client, commands);

client.login(process.env.TOKEN);
