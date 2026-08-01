import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import ping from './commands/ping.js';
import { registerReady } from './events/ready.js';
import { registerInteractionCreate } from './events/interactionCreate.js';
import type { Command } from './types/command.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, Command>([[ping.data.name, ping]]);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), {
  body: [ping.data.toJSON()],
});
console.log('Commands deployed.');
registerReady(client);
registerInteractionCreate(client, commands);

await client.login(process.env.DISCORD_BOT_TOKEN);
