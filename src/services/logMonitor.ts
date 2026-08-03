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
  channels: Record<LogType, string>;
  intervalMs: number;
  processExisting?: boolean;
}

export class LogMonitor {
  private readonly seen = new Set<string>();
  private timer?: ReturnType<typeof setInterval>;
  private initialized = false;

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
    const events = await this.options.zabbix.getHistory();
    console.log(events.length, 'Zabbix events retrieved');
    const fresh = events.filter((event) => !this.seen.has(this.eventId(event)));
    fresh.forEach((event) => this.seen.add(this.eventId(event)));
    if (!this.initialized && !this.options.processExisting) {
      this.initialized = true;
      return;
    }
    this.initialized = true;
    for (const event of [...fresh].reverse()) await this.publish(event);
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
    const channel = await this.options.client.channels.fetch(this.options.channels[type]);
    if (!channel?.isTextBased() || !('send' in channel)) throw new Error(`Channel for ${type} is not text-based`);
    let summary: string | undefined;
    if (this.options.ai) {
      try {
        summary = await this.options.ai.summarize(event.value);
      } catch (error) {
        console.error('AI enrichment failed; publishing the original log', error);
      }
    }
    await (channel as TextChannel).send({ embeds: [createLogEmbed(type, event, summary)] });
  }
}
