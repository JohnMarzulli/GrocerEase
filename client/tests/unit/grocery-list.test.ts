import { beforeEach, describe, expect, it } from 'vitest';
import { GroceryList } from '../../src/core/grocery-list';

describe('GroceryList', () => {
    let list: GroceryList;

    beforeEach(() => {
        localStorage.clear();
        list = GroceryList.load(crypto.randomUUID());
    });

    it('should add an item to the list', () => {
        const item = list.addItem('Milk', 2, 'gal');
        expect(item.name).toBe('Milk');
        expect(item.qty).toBe(2);
        expect(item.unit).toBe('gal');
    });

    it('should increment item quantity', () => {
        const item = list.addItem('Apples', 5, 'ea');
        const updated = list.increaseItemAmountById(item.id, 3);
        expect(updated.qty).toBe(8);
    });

    it('should decrement item quantity', () => {
        const item = list.addItem('Oranges', 5, 'ea');
        const updated = list.decreaseItemAmountById(item.id, 2);
        expect(updated?.qty).toBe(3);
    });

    it('should remove item when decremented to 0', () => {
        const item = list.addItem('Bread', 1, 'loaf');
        const result = list.decreaseItemAmountById(item.id, 1);
        expect(result).toBeUndefined();
    });

    it('should mark item as completed', () => {
        const item = list.addItem('Cheese', 1, 'lb');
        const updated = list.itemAcquired(item.id);
        expect(updated?.status).toBe('completed');
    });

    it('should put item back (mark as pending)', () => {
        const item = list.addItem('Eggs', 1, 'dozen');
        list.itemAcquired(item.id);
        const updated = list.putItemBack(item.id);
        expect(updated?.status).toBe('pending');
    });

    it('should rename an item', () => {
        const item = list.addItem('Rice', 1, 'lb');
        const updated = list.renameItemById(item.id, 'Brown Rice');
        expect(updated?.name).toBe('Brown Rice');
    });

    it('should change item order', () => {
        const item1 = list.addItem('Item 1', 1, 'ea');
        const item2 = list.addItem('Item 2', 1, 'ea');
        const item3 = list.addItem('Item 3', 1, 'ea');

        list.changeItemOrder(item1.id, 2);
        const updated = list.getList();
        const orders = updated.items.map((i: { order: any; }) => i.order);
        expect(orders).toContain(0);
        expect(orders).toContain(1);
        expect(orders).toContain(2);
    });

    it('should save list to storage', () => {
        const listId = list.getListId();
        list.addItem('Test', 1, 'ea');
        list.save();

        const loaded = GroceryList.load(listId);
        const items = loaded.getList().items;
        expect(items.length).toBeGreaterThan(0);
    });
});
