import { WindowsEvent } from '../types/windows-event.js';
import { Client } from 'discord.js';

export const processEvent = (client: Client) => async (event: WindowsEvent) => {
  // use client.channels.fetch(...)
};
