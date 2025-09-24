import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 200 + Math.random() * 600;

export class SimulatedListsService implements ListsService {
  private lists: Map<string, List> = new Map();

  constructor() {
    const id = crypto.randomUUID();
    const list: List = {
      id,
      name: 'My First List',
      createdAt: new Date().toISOString(),
      items: [
        { id: crypto.randomUUID(), name: 'Apples', qty: 4, unit: 'ea', status: 'pending' },
        { id: crypto.randomUUID(), name: 'Bread', qty: 1, unit: 'loaf', status: 'pending' },
      ],
    };
    this.lists.set(id, list);
  }

  async getLists(): Promise<ListSummary[]> {
    await sleep(latency());
    return Array.from(this.lists.values()).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  }

  async createList(name: string): Promise<ListSummary> {
    await sleep(latency());
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.lists.set(id, { id, name, createdAt, items: [] });
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
    return item;
  }
}
