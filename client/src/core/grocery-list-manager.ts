import * as encoding from '@/core/encoding';
import { GroceryList } from './grocery-list';

/**
 * Top level management for grocery lists.
 * Can load an existing list, or create a new one.
 */
export class GroceryListManager {
    public constructor() {
    }

    /**
     * Returns the list of available lists.
     * Return an empty set if none exist.
     * @returns The set of lists found
     */
    public getAvailableListIds(): string[] {
        return Object.keys(localStorage).filter(key => isUuid(key));
    }

    /**
     * Attempts to load a list with the given Id.
     * If the list is not found, then an empty list
     * is returned.
     * @param id The id of the list to load.
     * @returns A list.
     */
    public getList(
        id: string
    ): GroceryList {
        return GroceryList.load(id);
    }

    /**
     * Is the given list Id available?
     * @param id The uuid of the list to check.
     * @returns True if the list is available.
     */
    public isListAvailable(
        id: string
    ): boolean {
        const availableLists: string[] = this.getAvailableListIds();

        return availableLists.includes(id);
    }

    /**
     * Creates a new grocery list.
     * This new list will be saved automatically.
     * @returns A new grocery list.
     */
    public createNewList(): GroceryList {
        const list: GroceryList = GroceryList.load(crypto.randomUUID());
        list.setListName(`New List`);

        return list;
    }

    /**
     * Import a list. If the list already exists, merge the items.
     * @param listToImport The list we want to import
     * @returns The resulting list.
     */
    public importList(
        listToImport: GroceryList
    ): GroceryList {
        const listId: string = listToImport.getListId();

        if (!this.isListAvailable(listId)) {
            listToImport.save();

            return listToImport;
        }

        const existingList: GroceryList = this.getList(listId);

        for (const potentiallyNewItem of listToImport.getList().items) {
            const existingItemId: string | undefined = existingList.findItemInList(potentiallyNewItem.id, potentiallyNewItem.name);

            if (existingItemId) {
                existingList.renameItemById(existingItemId, potentiallyNewItem.name);
            } else {
                existingList.addItem(potentiallyNewItem.name, potentiallyNewItem.qty, potentiallyNewItem.unit);
            }
        }

        existingList.save();

        return existingList;
    }

    /**
     * Removes a list from storage.
     * @param id The uuid of the list to remove.
     */
    public removeList(
        id: string
    ): void {
        try {
            localStorage.removeItem(id);
        }
        catch {
            // ignore
        }
    }

    /**
     * Gets the default list Id.
     * 
     * If a list is not available, a new list will be created.
     * @returns 
     */
    public getDefaultListId(): string {
        const availableLists: string[] = this.getAvailableListIds();

        if (availableLists.length > 0) {
            return availableLists[0];
        }

        return this.createNewList().getList().id;
    }
}

/**
 * Is the given text a valid UUID?
 * @param value The text to see if it is a valid UUID.
 * @returns True if the text is a valid UUID.
 */
export function isUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return uuidRegex.test(value);
}

/**
 * Makes sure a valid list Id is returned from a query string.
 * @returns a valid list uuid.
 */
export function getValidListIdFromQueryParams(): string {
    const defaultListId: string = groceryListManager.getDefaultListId();

    try {
        const qs = new URLSearchParams(window.location.search);
        const id = qs.get('id') || defaultListId;

        if (!isUuid(id)) {
            return defaultListId;
        }

        return id;
    } catch {
        return defaultListId;
    }
}

export function getListName(
    listId: string,
) {
    if (!groceryListManager.isListAvailable(listId)) {
        return `Grocery List (New)`;
    }

    const list: GroceryList = groceryListManager.getList(listId);
    return list.getListName();
}

export function getListItemCount(
    listId: string,
) {
    if (!groceryListManager.isListAvailable(listId)) {
        return 0;
    }

    const list: GroceryList = groceryListManager.getList(listId);

    return list.getList().items.length;
}

export function getListItemsRemainingCount(
    listId: string,
) {
    if (!groceryListManager.isListAvailable(listId)) {
        return 0;
    }

    const list: GroceryList = groceryListManager.getList(listId);

    return list.getList().items.filter(i => i.status !== 'completed').length;
}

export function getItemsText(
    listId: string,
) {
    const noItems = "No items";

    if (!groceryListManager.isListAvailable(listId)) {
        return noItems;
    }

    const itemRemainingCount: number = getListItemsRemainingCount(listId);
    const itemTotalCount: number = getListItemCount(listId);

    let text: string = '';

    if (itemTotalCount === 0) {
        text = noItems;
    } else if (itemRemainingCount === 0) {
        text = 'Finished';
    } else {
        text = `${itemRemainingCount}/${itemTotalCount} :Remaining`;
    }

    return `(${text})`;
}

/**
 * Sort the list so that:
 * Lists with the most remaining items appear first.
 * Lists with the most total items appear next.
 * Finally, sort alphabetically by list name.
 * @param listA The first list to compare.
 * @param listB The second list to compare.
 * @returns The relative order of the two lists.
 */
export function sortListItems(
    listA: string,
    listB: string
) {
    const aRemaining = getListItemsRemainingCount(listA);
    const bRemaining = getListItemsRemainingCount(listB);

    if (aRemaining !== bRemaining) {
        return bRemaining - aRemaining;
    }

    const aTotal = getListItemCount(listA);
    const bTotal = getListItemCount(listB);

    if (aTotal !== bTotal) {
        return bTotal - aTotal;
    }

    return getListName(listA).localeCompare(getListName(listB));
}

export function getListFromData(
    data: string
): GroceryList | null {
    let parsed: any = encoding.getJsonFromImportData(data);

    const listId: string = parsed?.id;

    if (!listId || typeof listId !== 'string' || !isUuid(listId)) {
        return null;
    }

    // Ensure parsed looks like a list
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
        return null;
    }

    // Normalize: override id and ensure createdAt
    const list = {
        ...parsed,
        id: parsed.id,
        createdAt: parsed.createdAt ?? new Date().toISOString(),
        items: Array.isArray(parsed.items) ? parsed.items : [],
    };

    return new GroceryList(list);
}

export const groceryListManager = new GroceryListManager();