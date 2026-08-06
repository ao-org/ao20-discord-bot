import { AiClient } from '../dist/services/ai.js';
import { jest } from '@jest/globals';

describe('AiClient', () => {
  test('does not call the server without a token', async () => {
    const fetcher = jest.fn();
    await expect(
      new AiClient('url', undefined, 'model', fetcher).summarize('log'),
    ).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('extracts the chat completion content', async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '  resumen  ' } }] }), {
        status: 200,
      });
    await expect(new AiClient('url', 'token', 'model', fetcher).summarize('log')).resolves.toBe(
      'resumen',
    );
  });

  test('backs off after a 503 response', async () => {
    const fetcher = jest.fn(async () => new Response('', { status: 503 }));
    const client = new AiClient('url', 'token', 'model', fetcher);
    await expect(client.summarize('first')).rejects.toThrow('HTTP 503');
    await expect(client.summarize('second')).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
