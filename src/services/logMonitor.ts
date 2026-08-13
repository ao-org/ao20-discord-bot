import type { Client, TextChannel } from 'discord.js';
import type { LogType } from '../config.js';
import { classifyLog } from './logClassifier.js';
import { createLogEmbed } from './logEmbed.js';
import { AiClient } from './ai.js';
import { ZabbixClient, type ZabbixHistory } from './zabbix.js';

export interface LogMonitorOptions {
  client: Client;
  zabbix: ZabbixClient;
  ai?: AiClient;
  itemId: string;
  channels: Record<LogType, string>;
  intervalMs: number;
  processExisting?: boolean;
}

export class LogMonitor {
  private readonly seen = new Set<string>();
  private timer?: ReturnType<typeof setInterval>;
  private initialized = false;
  private polling = false;

  constructor(private readonly options: LogMonitorOptions) {}

  start(): void {
    void this.poll().catch((error) => console.error('Zabbix polling failed', error));
    this.timer = setInterval(
      () => void this.poll().catch((error) => console.error('Zabbix polling failed', error)),
      this.options.intervalMs,
    );
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async poll(): Promise<void> {
    if (this.polling) {
      console.log('Skipping Zabbix poll because the previous batch is still being published');
      return;
    }
    this.polling = true;
    try {
      const events = await this.options.zabbix.getHistory(this.options.itemId);
      console.log(events.length, 'Zabbix events retrieved');
      const fresh = events.filter((event) => !this.seen.has(this.eventId(event)));
      console.log(fresh.length, 'fresh Zabbix events;', fresh.filter((event) => classifyLog(event.value)).length, 'classified');
      if (!this.initialized && !this.options.processExisting) {
        fresh.forEach((event) => this.seen.add(this.eventId(event)));
        this.initialized = true;
        return;
      }
      this.initialized = true;
      for (const event of [...fresh].reverse()) {
        try {
          await this.publish(event);
          this.seen.add(this.eventId(event));
        } catch (error) {
          console.error(`Failed to publish Zabbix event to Discord (item ${event.itemid})`, error);
        }
      }
    } finally {
      this.polling = false;
    }
  }

  private eventId(event: ZabbixHistory): string {
    return event.logeventid ?? `${event.itemid}:${event.clock}:${event.ns ?? ''}:${event.value}`;
  }

  private async publish(event: ZabbixHistory): Promise<void> {
    const type = classifyLog(event.value);
    if (!type) {
      console.warn(`Ignoring unclassified Zabbix log: ${event.value.slice(0, 160)}`);
      return;
    }
    const channelId = this.options.channels[type];
    if (!channelId) {
      console.warn(`No Discord channel configured for ${type}; set DISCORD_LOG_CHANNEL_${type.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`);
      return;
    }
    const channel = await this.options.client.channels.fetch(channelId);
    if (!channel?.isTextBased() || !('send' in channel)) throw new Error(`Channel for ${type} is not text-based`);
    const textChannel = channel as TextChannel;
    const message = await textChannel.send({ embeds: [createLogEmbed(type, event)] });

    if (this.options.ai) {
      void this.options.ai
        .summarize(event.value)
        .then((summary) => (summary ? message.edit({ embeds: [createLogEmbed(type, event, summary)] }) : undefined))
        .catch((error) => console.error('AI enrichment failed; publishing the original log', error));
    }
  }
}
