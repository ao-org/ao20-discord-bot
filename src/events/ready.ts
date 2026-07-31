import { Client, Events } from 'discord.js';

export function registerReady(client: Client) {
  client.once(Events.ClientReady, (ready) => {
    console.log(`Logged in as ${ready.user.tag}`);
  });
}
