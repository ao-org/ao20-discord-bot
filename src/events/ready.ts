import { Client, Events } from 'discord.js';

export function registerReady(client: Client, onReady?: () => void) {
  client.once(Events.ClientReady, (ready) => {
    console.log(`Logged in as ${ready.user.tag}`);
    onReady?.();
  });
}
