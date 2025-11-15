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

    it('should not reduce list when an older version is imported', () => {
        const reimportListId: string = "b5e943e1-0b37-4d7d-be31-b43b4b36ebc5";
        const smallerList: string = "H4sIAAAAAAAACpXTvW5UQQwF4FdBrq%2FRjMfzd7tUCAlEQSoQhWfsIVvsLty9KaJo3x1FCbtLx30Bfzo6x8%2BwU5ihRasczKNrISNrVmwWPDYOjVtI1nqECQ6yN5jhw3Lstjy9%2B7Q7rTBBX0xW07sVZiBHEb1Hl%2B9dnLnOLr%2FPpX6DCXar7U8wf39%2BJXX4mls05OAJWYmxUWmYRnWukwYSupIfV9vDBL%2FXJ5hpgsfD7kUzgQlOq6yPJ5jhlx10d%2FgJExwXtQVmd57eMHGheuOCKYsgt5KwUC44rLDqoDT6DfZlfbDlr%2Bb%2FV%2FMXjWsatQRBzzKQJTBKUsJE0TrnokXDVft63NtmjC5YjVol1ISsTZFHKthS8Bgzc9Saa296xe4fXs9s08JF672bD7Vjz4OQc2ooyRO2VqOpmNcqV%2B3zcdkejS9Yilo18AvmK7L3GUU0oIrzQjV3Yvsn2mkzFq8TKd6pkMNSpCAHMqxWGK0WdWOEka3f7HE7lS7USBZi6gGbj4ysnbFlH9HJUHVUxelNZXebpXyVxOc0RsfCLSCTBmyZFYncUPPEHG%2BW%2BPbP27By%2FnH%2BA6ZKcjpGBAAA";
        const renamedExpandedList: string = "H4sIAAAAAAAACp3TzW5TQQwF4FepZn2NZjyeH99dFyyQQCyohACx8Iw9bRZJSnIrgaq%2BO6pakrDj8gL%2BdHSOH91G3exaMqZoAXyLBUiLQrMYoFFs1GK21pOb3E625mb39ue97NT06v3muLjJ9YPJYnq9uNmhxwQhgC83Ps3Esy9vSuWvbnKbxbZHN397fDF1BC4tGVAMCKRI0LA2yIO976gRBc%2Fmu8W2bnI%2Fll9uxsk97DbPmomb3HGR5eHoZndvO93sbt3k9ge1g5v90%2FSKiY8cjCrkIgLUaoaKpcKwSqoD8%2BgX2Mflzg5%2FtPCvWjhpxHlwjQKBZABJJJCsCBmTdSpVq8az9mm%2FtdUYnjBOyhI5A2lToJErtBwDpEKUlAv3pmfs5u7lzDotnrTeu4XIHXoZCFRyA8kBoTVOpmJBWc7aZzlefdgf1sejE5iTskZ6BgMDhVBARCOo%2BCDIpSPZX%2FGOq7F0nkkNXgU91CoVKKIBWyUwrurHiKNYv9jkeiqfqJEtptwjtJAISDtBKyGBl6HqkcXrRW3Xq6VyliSUPEaHSi0CoUZohRQQ%2FVALSJQu1vj60%2BuwesKQEuWYDHIsBsRYoYllaKqko%2BQqjc%2FYF1tv8clKkrGzMXAoEYiTAQdEkESjhjKKDxdtXe%2F2%2F%2FfW%2Fun702%2B0V%2Fj7KAUAAA%3D%3D";

        manager.removeList(reimportListId);

        // First import a newer, longer version of the list.
        const newerList: GroceryList = getListFromData(renamedExpandedList)!;
        expect(newerList.getListId()).toBe(reimportListId);
        expect(newerList).not.toBeNull();
        expect(newerList!.getList().items.length).toBe(11);
        expect(newerList!.findItemInList('', 'Was More')).not.toBeUndefined();
        expect(newerList!.findItemInList('', 'Was More')).not.toBeNull();
        expect(newerList!.findItemInList('', 'More')).toBeUndefined();

        newerList.save();

        // Now import an older, shorter version of the list.
        // Make sure the list is not the shorter length.
        const olderList: GroceryList = getListFromData(smallerList)!;
        expect(olderList.getListId()).toBe(reimportListId);
        expect(olderList!.getList().items.length).toBe(9);
        expect(olderList!.findItemInList('', 'Was More')).toBeUndefined();
        expect(olderList!.findItemInList('', 'More')).not.toBeUndefined();
        expect(olderList!.findItemInList('', 'More')).not.toBeNull();

        manager.importList(olderList);
        const mergedList: GroceryList = manager.getList(reimportListId);
        expect(mergedList).not.toBeNull();
        expect(mergedList!.getList().items.length).toBe(11);
        expect(mergedList!.findItemInList('', 'More')).not.toBeUndefined();
        expect(mergedList!.findItemInList('', 'Was More')).toBeUndefined();

    });
});

const compressedImportData: string = `H4sIAAAAAAAACp3UsY4bNxAG4Fc5sEmjCTjkkByq8xkuLynsKkGKIWcYC7cnXaR1YRj37oFysXYPKRxpt9798JMz%2Fze3U7d1ZkzBlCEmLUDsC4iPCLGG9v1xG7eXJ3Nb997281Gmuwc5PtrsNq4fTWbTd7PbuuBDAvQQyieft1i2yD9XjL%2B5jdvN9nRy29%2B%2FvaIp1UpBGViHAcVi0Bo3aLnzMG3Smy7op8Oz27i%2F5q9uixv3Zb87YyZu406zzF9Obuv64el5stnOXx2Oake39S%2BbfzVsiD2PAeEfLTWEGlghtZSzkDZredEedtPjDRxeuFh6iC1G4NE7UMABVcOAlnIaQqUNietwx3k3TXK6wQwX00w9dhKgoh5IQwD2PcLw3GsYHRPSYt7L%2FvW9BY0LWkM0MQPUMoBa8cADM9QWWLjnojGtRuezjZ9Odx9lmr%2Fe3cs03YLTBeeEPo9QIY3ogepQkIwBqnoUohqxrhL%2Fcni2G7h04QLWbNEyhKICFDoB54DgkxRjltEKrmbocPwh92x73e3%2FXLB8wbRp0UYBPPkI1GuAmkuGmMiiIpOts73b69VWWS6REKVqAqznacXKIJ495BbqyK1jH2%2BWQ3W6PhpfuMpdUBqBjlCAah9QWRAoNi5dEqU4Fu7j4el6rC6LX3sqIzLUyB2oDwYRrqApnEdW4mhltYmfX39znYZLz6hXrqUaiJACWSzAiRCK1W6lI%2BbYF%2B7DdLplJHEpmpLasKwKmMM5Xs%2FANhhSTA2j%2Bka6ivcgj9efJS4Vk6zQeQWAQmCgHhpwlAZFckCJnLjGN4f5w%2F3%2BrxZXmoYxAkLQEIHaaMDoM2BEHp1yFy%2BrOenHwzTN14NLn2CoFIwqpKzp3KAGtYiBYqrRF0qxrXbu1zGux5Y26dzS4NSBY0cgrwmkxAS%2BJd9qH4Sjvklntr%2FeWwoFzXwNShCtNyCTBNWywMDAmnRgW9%2Fd%2FWGeD0%2FfvfC%2FvfLyx8vfUyRF3FYIAAA%3D`;
const remergedCompressedData: string = `H4sIAAAAAAAACp3UwW4bNxAG4FcxeOlFU3DIITnULS56dHtIgAItehhyho3gteRKm0MQ%2BN0L1Y12jRxSafe8%2B%2BEnZ%2F4vbqdu68yYgilDTFqA2BcQHxFiDe3r4zZuL0%2Fmtu4n289Hme4e5Phos9u4fjSZTd%2FNbuuCDwnQQygffN5i2SL%2FWDH%2B7jZuN9vTyW3%2F%2BPKKplQrBWVgHQYUi0Fr3KDlzsO0SW%2B6oB8Oz27j%2Fp4%2Fuy1u3Kf97oyZuI07zTJ%2FOrmt64en58lmO391OKod3da%2FbP7TsCH2PAaEf7XUEGpghdRSzkLarOVFe9hNjzdweOFi6SG2GIFH70ABB1QNA1rKaQiVNiSuwx3n3TTJ6QYzXEwz9dhJgIp6IA0B2PcIw3OvYXRMSIt5L%2FvX9xY0LmgN0cQMUMsAasUDD8xQW2DhnovGtBqdjzZ%2BON29l2n%2BfHcv03QLThecE%2Fo8QoU0ogeqQ0EyBqjqUYhqxLpK%2FMvh2W7g0oULWLNFyxCKClDoBJwDgk9SjFlGK7hwv8np7uFw%2FC75bHvd7f9awHwBtWnRRgE8%2BQjUa4CaS4aYyKIik63zvdvr1VZZLpIQpWoCrOeJxcognj3kFurIrWMfbxZEdbo%2BGl%2B4yl1QGoGOUIBqH1BZECg2Ll0SpTgW7v3h6XqsLstfeyojMtTIHagPBhGuoCmcx1biaGW1jR9ff3OdhkvXqFeupRqIkAJZLMCJEIrVbqUj5tgX7ufpdMtY4lI2JbVhWRUwh3O8noFtMKSYGkb1jXQV70Eerz9LXGomWaHzGgCFwEA9NOAoDYrkgBI5cY1vDvO7O%2F6tFleahjECQtAQgdpowOgzYEQenXIXL6s56cfDNM3Xg0unYKgUjCqkrOncoga1iIFiqtEXSrGtdu7XMa7Hlkbp3NLg1IFjRyCvCaTEBL4l32ofhKO%2BSWe2v95bCgXNfA1KEK03IJME1bLAwMCadGBb3939YZ4PT1%2B98L%2B98vLnyz%2Fqf2agWggAAA%3D%3D`;