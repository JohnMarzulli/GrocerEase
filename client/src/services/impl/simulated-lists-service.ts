import { GroceryListManager } from '@/core/grocery-list-manager';
import GroceryList from '@/core/grocery-list';
import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 200 + Math.random() * 600;

export class SimulatedListsService implements ListsService {
  private groceryManager = new GroceryListManager();
  private groceryList: GroceryList;


  constructor() {
    const defaultListId = this.groceryManager.getDefaultListId();
    this.groceryList = GroceryList.load(defaultListId);
  }

  async getLists(): Promise<ListSummary[]> {
    await sleep(latency());
    const l = this.groceryList.getList();
    return [{ id: l.id, name: l.name, createdAt: l.createdAt }];
  }

  async createList(name: string): Promise<ListSummary> {
    await sleep(latency());
    const l = this.groceryList.getList();
    return { id: l.id, name: l.name, createdAt: l.createdAt };
  }

  async getList(
    listId: string
  ): Promise<List> {
    await sleep(latency());
    this.groceryList = GroceryList.load(listId);
    const list = this.groceryList.getList();

    return list;
  }

  async addItem(listId: string, name: string, qty = 1, unit = 'ea'): Promise<ListItem> {
    await sleep(latency());
    if (listId && listId !== this.groceryList.getList().id) throw new Error('List not found');
    return this.groceryList.addItem(name, qty, unit);
  }

  async toggleItem(listId: string, itemId: string): Promise<ListItem> {
    await sleep(latency());
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    const item = l.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    item.status = item.status === 'pending' ? 'completed' : 'pending';
    this.groceryList.save();
    return item;
  }

  async updateListName(listId: string, name: string): Promise<List> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    this.groceryList.setListName(name);
    return this.groceryList.getList();
  }

  async incrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    return this.groceryList.increaseItemAmountById(itemId, step);
  }

  async decrementItem(listId: string, itemId: string, step = 1): Promise<ListItem | undefined> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    return this.groceryList.decreaseItemAmountById(itemId, step);
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    this.groceryList.removeItemByItem(itemId);
  }

  async updateItemName(listId: string, itemId: string, name: string): Promise<ListItem> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    const updated = this.groceryList.renameItemById(itemId, name);
    if (!updated) throw new Error('Item not found');
    return updated;
  }

  async moveItem(listId: string, itemId: string, newOrder: number): Promise<ListItem> {
    const l = this.groceryList.getList();
    if (listId && listId !== l.id) throw new Error('List not found');
    return this.groceryList.changeItemOrder(itemId, newOrder);
  }
}
