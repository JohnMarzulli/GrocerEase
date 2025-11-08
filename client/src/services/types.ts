import { isUuid } from "@/core/grocery-list-manager";

export type ListItemStatus = 'pending' | 'completed';

export function compareListItems(a: ListItem, b: ListItem): number {
  // Items may be plain objects (deserialized from storage) and not instances
  // of the ListItem class, so avoid calling instance methods. Compare by
  // completed status first (completed items go last), then by order.
  const aCompleted = a.status === 'completed';
  const bCompleted = b.status === 'completed';

  if (aCompleted !== bCompleted) {
    return aCompleted ? 1 : -1;
  }

  // Fall back to numeric order (guard undefined)
  const aOrder = typeof a.order === 'number' ? a.order : 0;
  const bOrder = typeof b.order === 'number' ? b.order : 0;

  return aOrder - bOrder;
}

export class ListItem {
  constructor(
    id: string,
    name: string,
    qty: number,
    unit: string,
    status: ListItemStatus,
    order: number) {
    if (!isUuid(id)) {
      throw new Error(`Item id:'${id}' is not an UUID.`);
    }

    this.id = id;
    this.name = name.trim();
    this.qty = qty;
    this.unit = unit;
    this.status = status;
    this.order = order;
  }

  public id: string = crypto.randomUUID();
  public name: string = "New Item";
  public qty: number = 1;
  public unit: string = "ea";
  public status: ListItemStatus = "pending";
  public order: number = -1;

  public isCompleted(): boolean { return this.status === 'completed'; };

  public compare(
    other: ListItem
  ): number {
    return compareListItems(this, other);
  }
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
  refreshItem(listId: string, itemId: string): Promise<ListItem | undefined>;
  removeItem(listId: string, itemId: string): Promise<void>;
  updateItemName(listId: string, itemId: string, name: string): Promise<ListItem>;
  moveItem(listId: string, itemId: string, newOrder: number): Promise<ListItem>;
}
