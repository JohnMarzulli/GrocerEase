import { GroceryList } from './grocery-list';


/**
 * Top level management for grocery lists.
 * Can load an existing list, or create a new one.
 */
export class GoceryListManager {
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
     * @returns A new gocert list.
     */
    public createNewList(
        source: string
    ): GroceryList {
        const list: GroceryList = GroceryList.load(crypto.randomUUID());

        // $TODO - Remove this once debugged
        list.setListName(`Loaded from ${source}`);

        return list;
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

        return this.createNewList('getDefaultListId').getList().id;
    }
}

/**
 * Is the given text a valid UUID?
 * @param value The text to see if it is a valid UUID.
 * @returns True if the text is a valid UUID.
 */
function isUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return uuidRegex.test(value);
}