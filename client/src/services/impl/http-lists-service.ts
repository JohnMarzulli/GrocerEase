import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

export class HttpListsService implements ListsService {
  // API base can be configured via VITE_API_BASE. In development we
  // fall back to the local Functions host so you don't have to remember
  // to set the env var every time. `import.meta.env.DEV` is true when
  // running `npm run dev` or `vite` directly.
  private base =
    import.meta.env.VITE_API_BASE ||
    (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api');

  private async json<T>(url: string, init?: RequestInit): Promise<T> {
    // debugging: log the full url so we can see what the client is trying to contact
    // when things unexpectedly fail (e.g. addItem not hitting server).
    console.debug('[HttpListsService] fetch', url, init?.method);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
        ...init,
      });
    } catch (err: any) {
      // network/fetch failure
      throw new Error(`Fetch failed for ${url}: ${err?.message ?? err}`);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} @ ${url}`);
    }
    return (await res.json()) as T;
  }

  async getLists(): Promise<ListSummary[]> {
    return this.json(`${this.base}/lists`);
  }
  async createList(name: string): Promise<ListSummary> {
    return this.json(`${this.base}/lists`, { method: 'POST', body: JSON.stringify({ name }) });
  }
  async getList(id: string): Promise<List> {
    return this.json(`${this.base}/lists/${id}`);
  }
  async addItem(listId: string, name: string, qty = 1, unit = 'ea'): Promise<ListItem> {
    return this.json(`${this.base}/lists/${listId}/items`, { method: 'POST', body: JSON.stringify({ name, qty, unit }) });
  }
  async toggleItem(listId: string, itemId: string): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'toggle', listId }) });
  }

  async uploadList(list: List): Promise<ListSummary> {
    // Upload a full local list to the server. Server should create a list and items and
    // return a ListSummary { id, name, createdAt } and optionally isServer flag.
    return this.json(`${this.base}/lists/upload`, { method: 'POST', body: JSON.stringify({ list }) });
  }

  async updateListName(listId: string, name: string): Promise<List> {
    return this.json(`${this.base}/lists/${listId}`, { method: 'PATCH', body: JSON.stringify({ name }) });
  }

  async incrementItem(listId: string, itemId: string, step = 1): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'increment', step, listId }) });
  }

  async decrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'decrement', step, listId }) });
  }

  async refreshItem(listId: string, itemId: string): Promise<ListItem | undefined> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'refresh', listId }) });
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    await this.json(`${this.base}/list-items/${itemId}`, { method: 'DELETE', body: JSON.stringify({ listId }) });
  }

  async updateItemName(listId: string, itemId: string, name: string): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'rename', name, listId }) });
  }

  async moveItem(listId: string, itemId: string, newOrder: number): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'move', newOrder, listId }) });
  }
}
