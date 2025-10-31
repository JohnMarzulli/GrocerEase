import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

const nowIso = () => new Date().toISOString();

const seedLists: List[] = [
  {
    id: 'list-1',
    name: 'Weekly Groceries',
    createdAt: nowIso(),
    items: [
      { id: 'i-1', name: 'Bananas', qty: 6, unit: 'ea', status: 'pending', order: 0 },
      { id: 'i-2', name: 'Milk', qty: 1, unit: 'gal', status: 'completed', order: 1 },
    ],
  },
  {
    id: 'list-2',
    name: 'Party Supplies',
    createdAt: nowIso(),
    items: [
      { id: 'i-3', name: 'Chips', qty: 3, unit: 'bag', status: 'pending', order: 0 },
    ],
  },
];

export class MockListsService implements ListsService {
  private lists: Map<string, List> = new Map(seedLists.map((l) => [l.id, l]));

  async getLists(): Promise<ListSummary[]> {
    return Array.from(this.lists.values()).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  }

  async createList(name: string): Promise<ListSummary> {
    const id = `list-${Math.random().toString(36).slice(2, 9)}`;
    const createdAt = nowIso();
    const list: List = { id, name, createdAt, items: [] };
    this.lists.set(id, list);
    return { id, name, createdAt };
  }

  async getList(id: string): Promise<List> {
    const found = this.lists.get(id);
    if (!found) throw new Error('List not found');
    return JSON.parse(JSON.stringify(found));
  }

  async addItem(listId: string, name: string, qty = 1, unit = 'ea'): Promise<ListItem> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const maxOrder = list.items.reduce((max, i) => Math.max(max, i.order), -1);
    const item: ListItem = {
      id: `i-${Math.random().toString(36).slice(2, 9)}`,
      name,
      qty,
      unit,
      status: 'pending',
      order: maxOrder + 1
    };
    list.items.unshift(item);
    return item;
  }

  async toggleItem(listId: string, itemId: string): Promise<ListItem> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const item = list.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');
    item.status = item.status === 'pending' ? 'completed' : 'pending';
    return item;
  }

  async updateListName(listId: string, name: string): Promise<List> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    list.name = name.trim() || 'Grocery List';
    return JSON.parse(JSON.stringify(list));
  }

  async incrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const it = list.items.find(i => i.id === itemId);
    if (!it) throw new Error('Item not found');
    it.qty += Math.max(1, step);
    return it;
  }

  async decrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const it = list.items.find(i => i.id === itemId);
    if (!it) throw new Error('Item not found');
    it.qty -= Math.max(1, step);
    if (it.qty <= 0) {
      list.items = list.items.filter(i => i.id !== itemId);
      return undefined;
    }
    return it;
  }

  async refreshItem(listId: string, itemId: string): Promise<ListItem | undefined> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const it = list.items.find(i => i.id === itemId);
    if (!it) throw new Error('Item not found');

    it.status = 'pending';

    return it;
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    list.items = list.items.filter(i => i.id !== itemId);
  }

  async updateItemName(listId: string, itemId: string, name: string): Promise<ListItem> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const it = list.items.find(i => i.id === itemId);
    if (!it) throw new Error(`Item ${itemId} => ${name} not found`);
    it.name = name.trim() || it.name;
    return it;
  }

  async moveItem(listId: string, itemId: string, newOrder: number): Promise<ListItem> {
    const list = this.lists.get(listId);
    if (!list) throw new Error('List not found');
    const item = list.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const oldOrder = item.order ?? list.items.indexOf(item);
    if (newOrder === oldOrder) return item;

    // Update orders
    list.items.forEach(i => {
      const iOrder = i.order ?? list.items.indexOf(i);
      if (newOrder > oldOrder) {
        if (iOrder > oldOrder && iOrder <= newOrder) {
          i.order = iOrder - 1;
        }
      } else {
        if (iOrder >= newOrder && iOrder < oldOrder) {
          i.order = iOrder + 1;
        }
      }
    });

    item.order = newOrder;
    list.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return item;
  }
}
