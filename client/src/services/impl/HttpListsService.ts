import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

export class HttpListsService implements ListsService {
  private base = import.meta.env.VITE_API_BASE || '/api';

  private async json<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
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

  async updateListName(listId: string, name: string): Promise<List> {
    return this.json(`${this.base}/lists/${listId}`, { method: 'PATCH', body: JSON.stringify({ name }) });
  }

  async incrementItem(listId: string, itemId: string, step = 1): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'increment', step, listId }) });
  }

  async decrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'decrement', step, listId }) });
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    await this.json(`${this.base}/list-items/${itemId}`, { method: 'DELETE', body: JSON.stringify({ listId }) });
  }

  async updateItemName(listId: string, itemId: string, name: string): Promise<ListItem> {
    return this.json(`${this.base}/list-items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ op: 'rename', name, listId }) });
  }
}
