import { beforeEach, describe, expect, it } from 'vitest';
import { GroceryList } from '../../src/core/grocery-list';
import { getListFromData, GroceryListManager } from '../../src/core/grocery-list-manager';

describe('GroceryListManager', () => {
    let manager: GroceryListManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        manager = new GroceryListManager();
    });

    it('should create a new list', () => {
        const list = manager.createNewList();
        expect(list).toBeDefined();
        expect(list.getListName()).toBe('New List');
    });

    it('should get available list IDs', () => {
        const list1 = manager.createNewList();
        const list2 = manager.createNewList();

        const ids = manager.getAvailableListIds();

        expect(list1).toBeDefined();
        expect(list2).toBeDefined();
        expect(ids.length).toBeGreaterThanOrEqual(2);
    });

    it('should check if a list is available', () => {
        const list = manager.createNewList();
        const listId = list.getListId();

        expect(manager.isListAvailable(listId)).toBe(true);
    });

    it('should get the default list ID', () => {
        const defaultId = manager.getDefaultListId();
        expect(defaultId).toBeDefined();
        expect(typeof defaultId).toBe('string');
    });

    it('should remove a list', () => {
        const list = manager.createNewList();
        const listId = list.getListId();

        manager.removeList(listId);
        expect(manager.isListAvailable(listId)).toBe(false);
    });

    it('should load a list by ID', () => {
        const original = manager.createNewList();
        original.setListName('Test List');
        const listId = original.getListId();

        const loaded = manager.getList(listId);
        expect(loaded.getListName()).toBe('Test List');
    });

    it('should import a list', () => {
        const loadedList: GroceryList | null = getListFromData(compressedImportData);
        expect(loadedList).not.toBeNull();
        expect(loadedList!.getListName()).toBe('Central Market');
        expect(loadedList!.getList().items.length).toBe(18);
        expect(loadedList!.findItemInList('', "More")).toBe('2196e3e6-27da-42c4-8621-05a7e88afb71');
        expect(loadedList!.findItemInList('2196e3e6-27da-42c4-8621-05a7e88afb71', "More")).toBe('2196e3e6-27da-42c4-8621-05a7e88afb71');
        expect(loadedList!.findItemInList('2196e3e6-27da-42c4-8621-05a7e88afb71', '')).toBe('2196e3e6-27da-42c4-8621-05a7e88afb71');
        expect(loadedList!.findItemInList('', "Was More")).toBeUndefined();
    });

    it('should merge an imported list', () => {
        manager.importList(getListFromData(compressedImportData)!);
        manager.importList(getListFromData(remergedCompressedData)!);

        const mergedList: GroceryList = manager.getList('ee842ed8-35d7-4807-a031-392bbbbbbbbb');
        expect(mergedList).not.toBeNull();
        expect(mergedList!.getListName()).toBe('Central Market');
        expect(mergedList!.getList().items.length).toBe(18);
        expect(mergedList!.findItemInList('2196e3e6-27da-42c4-8621-05a7e88afb71', '')).toBe('2196e3e6-27da-42c4-8621-05a7e88afb71');
        expect(mergedList!.findItemInList('', "More")).toBeUndefined();
        expect(mergedList!.findItemInList('', "Was More")).toBe('2196e3e6-27da-42c4-8621-05a7e88afb71');
    });
});

const compressedImportData: string = `H4sIAAAAAAAACp3UsY4bNxAG4Fc5sEmjCTjkkByq8xkuLynsKkGKIWcYC7cnXaR1YRj37oFysXYPKRxpt9798JMz%2Fze3U7d1ZkzBlCEmLUDsC4iPCLGG9v1xG7eXJ3Nb997281Gmuwc5PtrsNq4fTWbTd7PbuuBDAvQQyieft1i2yD9XjL%2B5jdvN9nRy29%2B%2FvaIp1UpBGViHAcVi0Bo3aLnzMG3Smy7op8Oz27i%2F5q9uixv3Zb87YyZu406zzF9Obuv64el5stnOXx2Oake39S%2BbfzVsiD2PAeEfLTWEGlghtZSzkDZredEedtPjDRxeuFh6iC1G4NE7UMABVcOAlnIaQqUNietwx3k3TXK6wQwX00w9dhKgoh5IQwD2PcLw3GsYHRPSYt7L%2FvW9BY0LWkM0MQPUMoBa8cADM9QWWLjnojGtRuezjZ9Odx9lmr%2Fe3cs03YLTBeeEPo9QIY3ogepQkIwBqnoUohqxrhL%2Fcni2G7h04QLWbNEyhKICFDoB54DgkxRjltEKrmbocPwh92x73e3%2FXLB8wbRp0UYBPPkI1GuAmkuGmMiiIpOts73b69VWWS6REKVqAqznacXKIJ495BbqyK1jH2%2BWQ3W6PhpfuMpdUBqBjlCAah9QWRAoNi5dEqU4Fu7j4el6rC6LX3sqIzLUyB2oDwYRrqApnEdW4mhltYmfX39znYZLz6hXrqUaiJACWSzAiRCK1W6lI%2BbYF%2B7DdLplJHEpmpLasKwKmMM5Xs%2FANhhSTA2j%2Bka6ivcgj9efJS4Vk6zQeQWAQmCgHhpwlAZFckCJnLjGN4f5w%2F3%2BrxZXmoYxAkLQEIHaaMDoM2BEHp1yFy%2BrOenHwzTN14NLn2CoFIwqpKzp3KAGtYiBYqrRF0qxrXbu1zGux5Y26dzS4NSBY0cgrwmkxAS%2BJd9qH4Sjvklntr%2FeWwoFzXwNShCtNyCTBNWywMDAmnRgW9%2Fd%2FWGeD0%2FfvfC%2FvfLyx8vfUyRF3FYIAAA%3D`;
const remergedCompressedData: string = `H4sIAAAAAAAACp3UwW4bNxAG4FcxeOlFU3DIITnULS56dHtIgAItehhyho3gteRKm0MQ%2BN0L1Y12jRxSafe8%2B%2BEnZ%2F4vbqdu68yYgilDTFqA2BcQHxFiDe3r4zZuL0%2Fmtu4n289Hme4e5Phos9u4fjSZTd%2FNbuuCDwnQQygffN5i2SL%2FWDH%2B7jZuN9vTyW3%2F%2BPKKplQrBWVgHQYUi0Fr3KDlzsO0SW%2B6oB8Oz27j%2Fp4%2Fuy1u3Kf97oyZuI07zTJ%2FOrmt64en58lmO391OKod3da%2FbP7TsCH2PAaEf7XUEGpghdRSzkLarOVFe9hNjzdweOFi6SG2GIFH70ABB1QNA1rKaQiVNiSuwx3n3TTJ6QYzXEwz9dhJgIp6IA0B2PcIw3OvYXRMSIt5L%2FvX9xY0LmgN0cQMUMsAasUDD8xQW2DhnovGtBqdjzZ%2BON29l2n%2BfHcv03QLThecE%2Fo8QoU0ogeqQ0EyBqjqUYhqxLpK%2FMvh2W7g0oULWLNFyxCKClDoBJwDgk9SjFlGK7hwv8np7uFw%2FC75bHvd7f9awHwBtWnRRgE8%2BQjUa4CaS4aYyKIik63zvdvr1VZZLpIQpWoCrOeJxcognj3kFurIrWMfbxZEdbo%2BGl%2B4yl1QGoGOUIBqH1BZECg2Ll0SpTgW7v3h6XqsLstfeyojMtTIHagPBhGuoCmcx1biaGW1jR9ff3OdhkvXqFeupRqIkAJZLMCJEIrVbqUj5tgX7ufpdMtY4lI2JbVhWRUwh3O8noFtMKSYGkb1jXQV70Eerz9LXGomWaHzGgCFwEA9NOAoDYrkgBI5cY1vDvO7O%2F6tFleahjECQtAQgdpowOgzYEQenXIXL6s56cfDNM3Xg0unYKgUjCqkrOncoga1iIFiqtEXSrGtdu7XMa7Hlkbp3NLg1IFjRyCvCaTEBL4l32ofhKO%2BSWe2v95bCgXNfA1KEK03IJME1bLAwMCadGBb3939YZ4PT1%2B98L%2B98vLnyz%2Fqf2agWggAAA%3D%3D`;