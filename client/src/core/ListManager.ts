import { getCookie, setCookie, LIST_COOKIE } from '@/utils/cookies';
import type { List, ListItem } from '@/services/types';

const STORAGE_KEY = 'ge_single_list';

export class ListManager {
    private list: List;

    private constructor(list: List) {
        this.list = list;
    }

    static load(): ListManager {
        // Try localStorage first
        const raw = safeLocalStorageGet(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as List;
            ensureCookie(parsed.id);
            return new ListManager(parsed);
        }

        // Fallback: cookie id + storage by older key
        const idFromCookie = getCookie(LIST_COOKIE);
        if (idFromCookie) {
            const oldRaw = safeLocalStorageGet(`ge_list_${idFromCookie}`);
            if (oldRaw) {
                const parsed = JSON.parse(oldRaw) as List;
                safeLocalStorageSet(STORAGE_KEY, oldRaw);
                return new ListManager(parsed);
            }
        }

        // Create a new list
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

    getName(): string {
        return this.list.name;
    }

    setName(name: string): void {
        this.list.name = name?.trim() || 'Grocery List';
        this.save();
    }

    getList(): List {
        return deepClone(this.list);
    }

    addItem(name: string, qty = 1, unit = 'ea'): ListItem {
        const item: ListItem = {
            id: crypto.randomUUID(),
            name: name.trim(),
            qty: Math.max(1, Number(qty) || 1),
            unit: unit || 'ea',
            status: 'pending',
        };
        this.list.items.unshift(item);
        this.save();
        return item;
    }

    increment(itemId: string, step = 1): ListItem | undefined {
        const it = this.list.items.find(i => i.id === itemId);
        if (!it) return undefined;
        it.qty = Number(it.qty) + Math.max(1, step);
        this.save();
        return it;
    }

    decrement(itemId: string, step = 1): ListItem | undefined {
        const it = this.list.items.find(i => i.id === itemId);
        if (!it) return undefined;
        it.qty = Number(it.qty) - Math.max(1, step);
        if (it.qty <= 0) {
            this.remove(itemId);
            return undefined;
        }
        this.save();
        return it;
    }

    renameItem(itemId: string, newName: string): ListItem | undefined {
        const it = this.list.items.find(i => i.id === itemId);
        if (!it) return undefined;
        it.name = (newName ?? '').trim() || it.name;
        this.save();
        return it;
    }

    remove(itemId: string): void {
        this.list.items = this.list.items.filter(i => i.id !== itemId);
        this.save();
    }

    save(): void {
        safeLocalStorageSet(STORAGE_KEY, JSON.stringify(this.list));
        ensureCookie(this.list.id);
    }
}

function ensureCookie(id: string) {
    if (!getCookie(LIST_COOKIE)) {
        setCookie(LIST_COOKIE, id);
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
