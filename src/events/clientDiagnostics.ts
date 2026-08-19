import { Client, Events } from 'discord.js';

export function registerClientDiagnostics(client: Client): void {
  client.on(Events.Error, (error) => console.error('Discord client error', error));
  client.on(Events.Warn, (message) => console.warn('Discord client warning', message));
  client.on(Events.ShardError, (error, shardId) =>
    console.error(`Discord gateway shard ${shardId} error`, error),
  );
  client.on(Events.ShardDisconnect, (event, shardId) =>
    console.warn(
      `Discord gateway shard ${shardId} disconnected (code ${event.code}${event.reason ? `: ${event.reason}` : ''})`,
    ),
  );
  client.on(Events.ShardReconnecting, (shardId) =>
    console.warn(`Discord gateway shard ${shardId} reconnecting`),
  );
  client.on(Events.ShardResume, (shardId, replayedEvents) =>
    console.log(`Discord gateway shard ${shardId} resumed (${replayedEvents} events replayed)`),
  );
  client.on(Events.Invalidated, () => console.error('Discord session invalidated'));
}
