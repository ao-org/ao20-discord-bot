export interface ZabbixHistory {
  itemid: string;
  clock: string;
  ns?: string;
  value: string;
  logeventid?: string;
}

interface ZabbixResponse {
  result?: ZabbixHistory[];
  error?: { data?: string; message?: string };
}

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class ZabbixClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async getHistory(itemId: string, limit = 100): Promise<ZabbixHistory[]> {
    const response = await this.fetcher(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'history.get',
        params: { output: 'extend', history: 2, itemids: [itemId], sortfield: 'clock', sortorder: 'DESC', limit },
        auth: this.token,
        id: 1,
      }),
    });
    if (!response.ok) throw new Error(`Zabbix returned HTTP ${response.status}`);
    const body = (await response.json()) as ZabbixResponse;
    if (body.error) throw new Error(body.error.data ?? body.error.message ?? 'Zabbix API error');
    return body.result ?? [];
  }
}
