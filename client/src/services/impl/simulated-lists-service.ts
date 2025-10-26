import ListManager from '@/core/list-manager';
import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 200 + Math.random() * 600;

export class SimulatedListsService implements ListsService {
  private mgr: ListManager;

  constructor() {
    this.mgr = ListManager.load();
  }

  async getLists(): Promise<ListSummary[]> {
    await sleep(latency());
    const l = this.mgr.getList();
    return [{ id: l.id, name: l.name, createdAt: l.createdAt }];
  }

  async createList(name: string): Promise<ListSummary> {
    await sleep(latency());
    const l = this.mgr.getList();
    return { id: l.id, name: l.name, createdAt: l.createdAt };
  }

  async getList(id: string): Promise<List> {
    await sleep(latency());
    const l = this.mgr.getList();
    if (id && id !== l.id) throw new Error('List not found');
    return l;
  }

  async addItem(listId: string, name: string, qty = 1, unit = 'ea'): Promise<ListItem> {
    await sleep(latency());
    if (listId && listId !== this.mgr.getList().id) throw new Error('List not found');
    return this.mgr.addItem(name, qty, unit);
  }

  async toggleItem(listId: string, itemId: string): Promise<ListItem> {
    await sleep(latency());
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    const item = l.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    item.status = item.status === 'pending' ? 'completed' : 'pending';
    this.mgr.save();
    return item;
  }

  async updateListName(listId: string, name: string): Promise<List> {
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    this.mgr.setName(name);
    return this.mgr.getList();
  }

  async incrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    return this.mgr.increment(itemId, step);
  }

  async decrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    return this.mgr.decrement(itemId, step);
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    this.mgr.remove(itemId);
  }

  async updateItemName(listId: string, itemId: string, name: string): Promise<ListItem> {
    const l = this.mgr.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    const updated = this.mgr.renameItem(itemId, name);
    if (!updated) throw new Error('Item not found');
    return updated;
  }
}
