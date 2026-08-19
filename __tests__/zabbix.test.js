import { ZabbixClient } from '../dist/services/zabbix.js';

describe('ZabbixClient', () => {
  test('sends the expected history.get request', async () => {
    let request;
    const fetcher = async (_url, init) => {
      request = { url: _url, init };
      return new Response(
        JSON.stringify({ result: [{ itemid: '46595', clock: '1', value: 'log' }] }),
        { status: 200 },
      );
    };
    const client = new ZabbixClient('https://zabbix.test/api', 'secret', 15_000, fetcher);

    await expect(client.getHistory('46595', 25)).resolves.toHaveLength(1);
    expect(request.url).toBe('https://zabbix.test/api');
    expect(request.init.method).toBe('POST');
    expect(request.init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(request.init.body)).toMatchObject({
      method: 'history.get',
      auth: 'secret',
      params: expect.objectContaining({ history: 2, itemids: ['46595'], limit: 25 }),
    });
  });

  test('throws API errors and HTTP errors', async () => {
    const apiError = new ZabbixClient(
      'url',
      'token',
      15_000,
      async () =>
        new Response(JSON.stringify({ error: { data: 'invalid token' } }), { status: 200 }),
    );
    await expect(apiError.getHistory('1')).rejects.toThrow('invalid token');

    const httpError = new ZabbixClient(
      'url',
      'token',
      15_000,
      async () => new Response('', { status: 500 }),
    );
    await expect(httpError.getHistory('1')).rejects.toThrow('HTTP 500');
  });

  test('aborts a stalled request after the configured timeout', async () => {
    const client = new ZabbixClient('url', 'token', 10, async (_url, init) => {
      await new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
      });
    });

    await expect(client.getHistory('1')).rejects.toMatchObject({ name: 'TimeoutError' });
  });
});
