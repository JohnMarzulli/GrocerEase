import type { List, ListItem } from '@/services/types';
import * as cookies from '@/utils/cookies';

const STORAGE_KEY = 'ge_single_list';
const LIST_ID_COOKIE = 'ge_list_id';

function getLocalStorageKey(
    cookieId: string
) {
    return `ge_list_${cookieId}`;
}

function getSavedList(
    cookieId: string
): List {
    const oldRaw = safeLocalStorageGet(getLocalStorageKey(cookieId));

    if (oldRaw) {
        return JSON.parse(oldRaw) as List;
    }

    throw new Error('No saved list found');
}

export class ListManager {
    static load(): ListManager {
        const idFromCookie = cookies.getCookie(LIST_ID_COOKIE);

        if (idFromCookie) {
            return new ListManager(getSavedList(idFromCookie));
        }

        return ListManager.createNewList();
    }

    public save(): void {
        cookies.setCookie(LIST_ID_COOKIE, this.list.id);
        safeLocalStorageSet(getLocalStorageKey(this.list.id), JSON.stringify(this.list));
        ensureCookie(this.list.id);
    }

    public getListName(): string {
        return this.list.name;
    }

    public setListName(name: string): void {
        this.list.name = name?.trim() || 'Grocery List';
        this.save();
    }

    public getList(): List {
        return deepClone(this.list);
    }

    public addItem(
        name: string,
        qty = 1,
        unit = 'ea'
    ): ListItem {
        const existingItem = this.findItemByName(name);

        if (existingItem) {
            return this.increment(existingItem.id, qty);
        }

        // Find max order and add 1, or use 0 if no items
        const maxOrder = this.list.items.reduce((max, item) => Math.max(max, item.order), -1);

        const item: ListItem = {
            id: crypto.randomUUID(),
            name: name.trim(),
            qty: Math.max(1, Number(qty) || 1),
            unit: unit || 'ea',
            status: 'pending',
            order: maxOrder + 1
        };
        this.list.items.unshift(item);
        this.sortItems();
        this.save();

        return item;
    }

    public increment(
        itemId: string,
        step: number = 1
    ): ListItem {
        const it = this.findItemById(itemId);

        if (!it) {
            throw new Error('Item not found');
        }

        it.qty = Number(it.qty) + Math.max(1, step);
        this.save();

        return it;
    }

    public decrement(
        itemId: string,
        step: number = 1
    ): ListItem | undefined {
        const it = this.findItemById(itemId);

        if (!it) return undefined;

        it.qty = Number(it.qty) - Math.max(1, step);

        if (it.qty <= 0) {
            return this.remove(itemId);
        }

        this.save();

        return it;
    }

    public remove(
        itemId: string
    ): undefined {
        this.list.items = this.list.items.filter(i => i.id !== itemId);
        this.save();

        return undefined;
    }

    public renameItem(
        itemId: string,
        newName: string
    ): ListItem | undefined {
        const it = this.findItemByName(itemId);

        if (!it) return undefined;

        it.name = (newName ?? '').trim() || it.name;
        this.save();

        return it;
    }

    private findItemByName(
        name: string
    ): ListItem | undefined {
        return this.list.items.find(i => i.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    }

    private findItemById(
        id: string
    ): ListItem | undefined {
        return this.list.items.find(i => i.id === id);
    }

    public moveItem(itemId: string, newOrder: number): ListItem {
        const item = this.findItemById(itemId);
        if (!item) throw new Error('Item not found');

        const oldOrder = item.order;

        if (newOrder === oldOrder) return item;

        // Update orders of items between old and new positions
        if (newOrder > oldOrder) {
            // Moving down - decrement items in between
            this.list.items.forEach(i => {
                if (i.order > oldOrder && i.order <= newOrder) {
                    i.order--;
                }
            });
        } else {
            // Moving up - increment items in between
            this.list.items.forEach(i => {
                if (i.order >= newOrder && i.order < oldOrder) {
                    i.order++;
                }
            });
        }

        item.order = newOrder;
        this.sortItems();
        this.save();
        return item;
    }

    private sortItems(): void {
        this.list.items.sort((a, b) => a.order - b.order);
    }

    private static createNewList(): ListManager {
        const id = crypto.randomUUID();
        const list: List = {
            id,
            name: 'Grocery List',
            createdAt: new Date().toISOString(),
            items: [],
        };
        ensureCookie(id);
        safeLocalStorageSet(STORAGE_KEY, JSON.stringify(list));

        return new ListManager(list);
    }

    private constructor(list: List) {
        // Ensure all items have an order
        list.items.forEach((item, index) => {
            if (item.order === undefined) {
                item.order = index;
            }
        });
        this.list = list;
    }

    private list: List;
}

export function getListCookie(): string | null {
    return cookies.getCookie(LIST_ID_COOKIE);
}

export function saveListCookie(id: string) {
    cookies.setCookie(LIST_ID_COOKIE, id);
}

function ensureCookie(id: string) {
    if (!cookies.getCookie(LIST_ID_COOKIE)) {
        cookies.setCookie(LIST_ID_COOKIE, id);
    }
}

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function safeLocalStorageGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function safeLocalStorageSet(key: string, val: string) {
    try { localStorage.setItem(key, val); } catch { }
}

export default ListManager;
