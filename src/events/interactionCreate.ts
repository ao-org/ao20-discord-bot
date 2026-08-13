import { Client, Events } from 'discord.js';
import { Command } from '../types/command.js';
export function registerInteractionCreate(client: Client, commands: Map<string, Command>) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Something went wrong.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'Something went wrong.',
          ephemeral: true,
        });
      }
    }
  });
}
