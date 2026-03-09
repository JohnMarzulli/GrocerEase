import { addServerList, isServerListId } from '@/core/server-lists';
import { TOKENS } from '@/di/tokens';
import { useService } from '@/di/useService';
import type { List, ListItem, ListsService } from '@/services/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useListsService = (): ListsService => useService<ListsService>(TOKENS.ListsService);

export function useLists() {
  const api = useListsService();
  return useQuery({ queryKey: ['lists'], queryFn: () => api.getLists() });
}

export function useCreateList() {
  const api = useListsService();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.createList(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useList(id?: string, opts?: { enabled?: boolean; }) {
  const api = useListsService();
  const server = id ? isServerListId(id) : false;

  return useQuery<List>({
    queryKey: ['list', id],
    queryFn: async () => {
      if (server) {
        return api.getList(id as string);
      }

      // Not a known server list. If the ID is also absent from localStorage it may
      // be a cloud list being opened via a shared link on a fresh session.
      // Attempt a server lookup before falling back to creating a new local list.
      const localRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(id as string) : null;
      if (!localRaw) {
        try {
          const serverList = await api.getList(id as string);
          // Register so subsequent operations (add item, toggle, etc.) route correctly.
          addServerList({ id: serverList.id, name: serverList.name, createdAt: serverList.createdAt, isServer: true });
          return serverList;
        } catch {
          // Not on server – fall through and create a new local list
        }
      }

      // local: load from manager (creates a new empty list if not found)
      const { groceryListManager } = await import('@/core/grocery-list-manager');
      return groceryListManager.getList(id as string).getList();
    },
    enabled: opts?.enabled ?? true,
    retry: false, // if not found, surface error immediately so UI can create a new list
  });
}

export function useAddItem(id: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(id);

  return useMutation<ListItem, Error, { name: string; qty?: number; unit?: string; }>(
    {
      mutationFn: async ({ name, qty, unit }) => {
        if (server) {
          return api.addItem(id, name, qty, unit);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          return groceryListManager.getList(id).addItem(name, qty, unit);
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['list', id] });
      },
    }
  );
}

export function useToggleItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem, Error, { itemId: string; }>({
    mutationFn: async ({ itemId }) => {
      if (server) {
        return api.toggleItem(listId, itemId);
      } else {
        const { groceryListManager } = await import('@/core/grocery-list-manager');
        const list = groceryListManager.getList(listId);
        const item = list.getList().items.find(i => i.id === itemId);
        if (!item) throw new Error('Item not found');
        item.status = item.status === 'pending' ? 'completed' : 'pending';
        list.save();
        return item as ListItem;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
  });
}

export function useRenameList(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<List, Error, { name: string; }>({
    mutationFn: async ({ name }) => {
      if (server) {
        return api.updateListName(listId, name);
      } else {
        const { groceryListManager } = await import('@/core/grocery-list-manager');
        const list = groceryListManager.getList(listId);
        list.setListName(name);
        return list.getList();
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
  });
}

export function useIncrementItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem | undefined, Error, { itemId: string; step?: number; }>(
    {
      mutationFn: async ({ itemId, step }) => {
        if (server) {
          return api.incrementItem(listId, itemId, step);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          return groceryListManager.getList(listId).increaseItemAmountById(itemId, step);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

export function useDecrementItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem | undefined, Error, { itemId: string; step?: number; }>(
    {
      mutationFn: async ({ itemId, step }) => {
        if (server) {
          return api.decrementItem(listId, itemId, step);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          return groceryListManager.getList(listId).decreaseItemAmountById(itemId, step);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

export function useRefreshItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem | undefined, Error, { itemId: string; }>(
    {
      mutationFn: async ({ itemId }) => {
        if (server) {
          return api.refreshItem(listId, itemId);
        } else {
          // local refresh is no-op
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          const list = groceryListManager.getList(listId);
          return list.getList().items.find(i => i.id === itemId);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

export function useRemoveItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<void, Error, { itemId: string; }>(
    {
      mutationFn: async ({ itemId }) => {
        if (server) {
          return api.removeItem(listId, itemId);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          groceryListManager.getList(listId).removeItemByItem(itemId);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

export function useRenameItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem, Error, { itemId: string; name: string; }>(
    {
      mutationFn: async ({ itemId, name }) => {
        if (server) {
          return api.updateItemName(listId, itemId, name);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          const list = groceryListManager.getList(listId);
          list.renameItemById(itemId, name);
          return list.getList().items.find(i => i.id === itemId) as ListItem;
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

export function useMoveItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  const server = isServerListId(listId);

  return useMutation<ListItem, Error, { itemId: string; newOrder: number; }>(
    {
      mutationFn: async ({ itemId, newOrder }) => {
        if (server) {
          return api.moveItem(listId, itemId, newOrder);
        } else {
          const { groceryListManager } = await import('@/core/grocery-list-manager');
          return groceryListManager.getList(listId).changeItemOrder(itemId, newOrder);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
    }
  );
}

// Upload a local GroceryList to the server and remove the local copy on success
export function useUploadLocalList() {
  const api = useListsService();
  const qc = useQueryClient();

  return useMutation<List, Error, { listId: string; }>(
    {
      mutationFn: async ({ listId }) => {
        // Dynamically import to avoid circular dependency in module load
        const { groceryListManager } = await import('@/core/grocery-list-manager');
        const { getServerLists, addServerList } = await import('@/core/server-lists');

        const list = groceryListManager.getList(listId).getList();

        const uploaded = await api.uploadList(list);

        // Mark as server list locally
        addServerList({ ...uploaded, isServer: true });

        // Remove local copy
        groceryListManager.removeList(listId);

        // Invalidate list queries
        qc.invalidateQueries({ queryKey: ['lists'] });

        return uploaded as unknown as List;
      },
    }
  );
}
