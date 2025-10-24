import type { List, ListItem, ListSummary, ListsService } from '@/services/types';
import { getCookie, setCookie, LIST_COOKIE } from '@/utils/cookies';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 200 + Math.random() * 600;

export class SimulatedListsService implements ListsService {
  private lists: Map<string, List> = new Map();
  private storageKey = (id: string) => `ge_list_${id}`;
  private save(list: List) {
    try { localStorage.setItem(this.storageKey(list.id), JSON.stringify(list)); } catch {}
  }

  constructor() {
    const existingId = getCookie(LIST_COOKIE);
    if (existingId) {
      const saved = localStorage.getItem(this.storageKey(existingId));
      if (saved) {
        const list = JSON.parse(saved) as List;
        this.lists.set(list.id, list);
        return;
      }
    }
    const id = crypto.randomUUID();
    const list: List = {
      id,
      name: 'My List',
      createdAt: new Date().toISOString(),
      items: [],
    };
    this.lists.set(id, list);
    setCookie(LIST_COOKIE, id);
    this.save(list);
  }

  async getLists(): Promise<ListSummary[]> {
    await sleep(latency());
    return Array.from(this.lists.values()).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  }

  async createList(name: string): Promise<ListSummary> {
    await sleep(latency());
    // Single-list behavior: return existing list if present
    const first = this.lists.values().next().value as List | undefined;
    if (first) {
      return { id: first.id, name: first.name, createdAt: first.createdAt };
    }
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const list: List = { id, name, createdAt, items: [] };
    this.lists.set(id, list);
    setCookie(LIST_COOKIE, id);
    this.save(list);
    return { id, name, createdAt };
  }

  async getList(id: string): Promise<List> {
    await sleep(latency());
    const found = this.lists.get(id);
    if (!found) {
      throw new Error('List not found');
    }
    // deep copy
    return JSON.parse(JSON.stringify(found));
  }

  async addItem(listId: string, name: string, qty = 1, unit = 'ea'): Promise<ListItem> {
    await sleep(latency());
    const list = this.lists.get(listId);
    if (!list) {
      throw new Error('List not found');
    }
    const item: ListItem = { id: crypto.randomUUID(), name, qty, unit, status: 'pending' };
    list.items.unshift(item);
    this.save(list);
    return item;
  }

  async toggleItem(listId: string, itemId: string): Promise<ListItem> {
    await sleep(latency());
    const list = this.lists.get(listId);
    if (!list) {
      throw new Error('List not found');
    }
    const item = list.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    item.status = item.status === 'pending' ? 'completed' : 'pending';
    this.save(list);
    return item;
  }
}
