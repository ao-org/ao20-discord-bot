import { LogMonitor } from '../dist/services/logMonitor.js';
import { jest } from '@jest/globals';

const event = (value, clock = '1') => ({ itemid: '46595', clock, ns: '0', value });

function makeClient() {
  const send = jest.fn(async () => ({ edit: jest.fn(async () => undefined) }));
  const channel = { isTextBased: () => true, send };
  return { client: { channels: { fetch: jest.fn(async () => channel) } }, send };
}

describe('LogMonitor', () => {
  test('publishes classified events once and deduplicates subsequent polls', async () => {
    const setup = makeClient();
    const zabbix = { getHistory: jest.fn(async () => [event('13 - [Performance.log] slow', '1')]) };
    const monitor = new LogMonitor({
      client: setup.client,
      zabbix,
      itemId: '46595',
      channels: { 'Performance.log': 'performance-channel' },
      intervalMs: 60_000,
      processExisting: true,
    });

    await monitor.poll();
    await monitor.poll();

    expect(zabbix.getHistory).toHaveBeenCalledTimes(2);
    expect(setup.client.channels.fetch).toHaveBeenCalledWith('performance-channel');
    expect(setup.send).toHaveBeenCalledTimes(1);
  });

  test('skips the initial backlog when processExisting is false', async () => {
    const setup = makeClient();
    const zabbix = { getHistory: jest.fn(async () => [event('13 - [Performance.log] old', '1')]) };
    const monitor = new LogMonitor({
      client: setup.client,
      zabbix,
      itemId: '46595',
      channels: { 'Performance.log': 'performance-channel' },
      intervalMs: 60_000,
      processExisting: false,
    });

    await monitor.poll();
    expect(setup.send).not.toHaveBeenCalled();
  });
});
