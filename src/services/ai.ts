import type { FetchLike } from './zabbix.js';

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class AiClient {
  private unavailableUntil = 0;
  private requestInFlight = false;

  constructor(
    private readonly url: string,
    private readonly token: string | undefined,
    private readonly model: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async summarize(log: string): Promise<string | undefined> {
    if (!this.token) return undefined;
    if (Date.now() < this.unavailableUntil) return undefined;
    if (this.requestInFlight) return undefined;
    this.requestInFlight = true;
    try {
    let response: Response;
    try {
      response = await this.fetcher(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: 'system', content: 'Resume logs de un servidor de videojuego en español. Sé breve y factual. No inventes datos.' },
          { role: 'user', content: log },
        ],
      }),
      signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') this.unavailableUntil = Date.now() + 60_000;
      throw error;
    }
    if (!response.ok) {
      if (response.status === 503) this.unavailableUntil = Date.now() + 60_000;
      throw new Error(`AI server returned HTTP ${response.status}`);
    }
    const body = (await response.json()) as ChatResponse;
    return body.choices?.[0]?.message?.content?.trim() || undefined;
    } finally {
      this.requestInFlight = false;
    }
  }
}
