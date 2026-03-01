import { getServerLists, addServerList, removeServerList, isServerListId } from '@/core/server-lists';

describe('server-lists utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('addServerList stores a summary and isServerListId reflects it', () => {
    const summary = { id: 'abc-123', name: 'Foo', createdAt: '2020-01-01T00:00:00Z' } as any;
    expect(getServerLists()).toEqual([]);
    addServerList(summary);
    expect(getServerLists()).toEqual([summary]);
    expect(isServerListId('abc-123')).toBe(true);
    expect(isServerListId('other')).toBe(false);
  });

  test('removeServerList drops an entry', () => {
    const summary1 = { id: 'one', name: 'One', createdAt: '2020-01-01T00:00:00Z' } as any;
    const summary2 = { id: 'two', name: 'Two', createdAt: '2020-01-02T00:00:00Z' } as any;
    addServerList(summary1);
    addServerList(summary2);
    expect(getServerLists().map(l => l.id).sort()).toEqual(['one', 'two']);

    removeServerList('one');
    expect(getServerLists().map(l => l.id)).toEqual(['two']);
    expect(isServerListId('one')).toBe(false);
  });

  test('addServerList is idempotent', () => {
    const summary = { id: 'dup', name: 'Dup', createdAt: '2020-01-03T00:00:00Z' } as any;
    addServerList(summary);
    addServerList(summary);
    expect(getServerLists()).toEqual([summary]);
  });
});
