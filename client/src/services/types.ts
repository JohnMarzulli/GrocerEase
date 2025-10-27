export type ListItemStatus = 'pending' | 'completed';

export interface ListItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  status: ListItemStatus;
  order: number;
}

export interface ListSummary {
  id: string;
  name: string;
  createdAt: string; // ISO string
}

export interface List extends ListSummary {
  items: ListItem[];
}

export interface ListsService {
  getLists(): Promise<ListSummary[]>;
  createList(name: string): Promise<ListSummary>;
  getList(id: string): Promise<List>;
  addItem(listId: string, name: string, qty?: number, unit?: string): Promise<ListItem>;
  toggleItem(listId: string, itemId: string): Promise<ListItem>;
  updateListName(listId: string, name: string): Promise<List>;
  incrementItem(listId: string, itemId: string, step?: number): Promise<ListItem | undefined>;
  decrementItem(listId: string, itemId: string, step?: number): Promise<ListItem | undefined>;
  removeItem(listId: string, itemId: string): Promise<void>;
  updateItemName(listId: string, itemId: string, name: string): Promise<ListItem>;
  moveItem(listId: string, itemId: string, newOrder: number): Promise<ListItem>;
}
