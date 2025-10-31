import type { List, ListItem } from '@/services/types';
import { isUuid } from './grocery-list-manager';

/**
 * Holds a grocery list.
 * 
 * Handles the loading from storage, saving to storage, and modification of the list.
 */
export class GroceryList {
    /**
     * Load a list from storage.
     * @param listId The uuid of the list to load.
     * @returns The loaded list. If the list was not found, a new list is created.
     */
    static load(
        listId: string
    ): GroceryList {
        let step: string = 'load::start';
        try {
            const loadedList = getSavedList(listId);
            step = 'load::loaded';
            return new GroceryList(loadedList);
        }
        catch {
            if (isUuid(listId)) {
                return GroceryList.createNewListWithId(listId);
            }

            return GroceryList.createNewList();
        }
    }

    /**
     * Gets the Id of the list.
     * @returns The uuid of the list.
     */
    public getListId(): string {
        return this.list.id;
    }

    /**
     * Save the list to storage.
     */
    public save(): void {
        safeLocalStorageSet(this.list.id, JSON.stringify(this.list));
    }

    /**
     * Gets the name of the list.
     */
    public getListName(): string {
        return this.list.name;
    }

    /**
     * Changes the name of the list.
     * @param name 
     */
    public setListName(
        name: string
    ): void {
        this.list.name = name?.trim() || 'Grocery List';
        this.save();
    }

    /**
     * Gets a CLONE of the list.
     * @returns A deep clone of the list.
     */
    public getList(): List {
        return deepClone(this.list);
    }

    /**
     * Attempts to add an item to the list.
     * If the item already exists (by name), then the quantity is increased instead.
     * @param name The name of the item to add.
     * @param qty The number of items to add. Default is 1.
     * @param unit The units of the item to add. Default is 'ea'.
     * @returns The new list item.
     */
    public addItem(
        name: string,
        qty = 1,
        unit = 'ea'
    ): ListItem {
        const existingItem = this.findItemByName(name);

        if (existingItem) {
            return this.increaseItemAmountById(existingItem.id, qty);
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

    /**
     * Increases the quantity of an item by Id.
     * @param itemId The uuid of the list item to increase.
     * @param step How much to increase by.
     * @returns The updated list item.
     */
    public increaseItemAmountById(
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

    /**
     * Decreases the quantity of an item by Id.
     * @param itemId The uuid of the list item to decrease.
     * @param step How much to decrease by.
     * @returns The updated list item.
     */
    public decreaseItemAmountById(
        itemId: string,
        step: number = 1
    ): ListItem | undefined {
        const it = this.findItemById(itemId);

        if (!it) return undefined;

        it.qty = Number(it.qty) - Math.max(1, step);

        if (it.qty <= 0) {
            return this.removeItemByItem(itemId);
        }

        this.save();

        return it;
    }

    /**
     * Un-marks the item, like it was put back on the shelf.
     * @param itemId The item that is no longer in our basket.
     * @returns The updated item
     */
    public putItemBack(
        itemId: string
    ): ListItem | undefined {
        const item: ListItem | undefined = this.findItemById(itemId);

        if (item) {
            item.status = 'pending';
            this.save();
        }

        return item;
    }

    /**
     * Marks an item as acquired by its item id.
     * @param itemId The uuid of the list item to mark as acquired.
     * @returns The updated list item.
     */
    public itemAcquired(
        itemId: string
    ): ListItem | undefined {
        const item: ListItem | undefined = this.findItemById(itemId);

        if (item) {
            item.status = 'completed';
            this.save();
        }

        return item;
    }

    /**
     * Removes an item from the list by its item id.
     * @param itemId The uuid of the list item to remove.
     * @returns undefined
     */
    public removeItemByItem(
        itemId: string
    ): undefined {
        this.list.items = this.list.items.filter(i => i.id !== itemId);
        this.save();

        return undefined;
    }

    /**
     * Renames the item with the given id.
     * @param itemId The uuid of the item to rename.
     * @param newName The new name for the item.
     * @returns The updated list item.
     */
    public renameItemById(
        itemId: string,
        newName: string
    ): ListItem | undefined {
        const it = this.findItemById(itemId);

        if (!it) return undefined;

        it.name = (newName ?? '').trim() || it.name;
        this.save();

        return it;
    }

    /**
     * Move the item to a new spot in the list.
     * @param itemId The uuid of the item to move.
     * @param newOrder The new index/order for the item.
     * @returns The updated list item.
     */
    public changeItemOrder(
        itemId: string,
        newOrder: number
    ): ListItem {
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

    private sortItems(): void {
        this.list.items.sort((a, b) => a.order - b.order);
    }

    private static createNewListWithId(
        listId: string
    ): GroceryList {
        const list: List = {
            id: listId,
            name: `Grocery List`,
            createdAt: new Date().toISOString(),
            items: [],
        };

        safeLocalStorageSet(listId, JSON.stringify(list));

        return new GroceryList(list);
    }

    private static createNewList(): GroceryList {
        const id = crypto.randomUUID();
        const list: List = {
            id,
            name: `New Grocery List`,
            createdAt: new Date().toISOString(),
            items: [],
        };

        safeLocalStorageSet(id, JSON.stringify(list));

        return new GroceryList(list);
    }

    private constructor(
        list: List
    ) {
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


function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function safeLocalStorageGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function safeLocalStorageSet(key: string, val: string) {
    try { localStorage.setItem(key, val); } catch { }
}

export default GroceryList;

function getSavedList(
    storageKey: string
): List {
    const oldRaw = safeLocalStorageGet(storageKey);

    if (oldRaw) {
        return JSON.parse(oldRaw) as List;
    }

    throw new Error('No saved list found');
}