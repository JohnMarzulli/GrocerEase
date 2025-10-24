import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TOKENS } from '@/di/tokens';
import { useService } from '@/di/useService';
import type { List, ListItem, ListSummary, ListsService } from '@/services/types';

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

export function useList(id?: string, opts?: { enabled?: boolean }) {
  const api = useListsService();
  return useQuery<List>({
    queryKey: ['list', id],
    queryFn: () => api.getList(id as string),
    enabled: opts?.enabled ?? true,
    retry: false, // if not found, surface error immediately so UI can create a new list
  });
}

export function useAddItem(id: string) {
  const api = useListsService();
  const qc = useQueryClient();
  return useMutation<ListItem, Error, { name: string; qty?: number; unit?: string }>(
    {
      mutationFn: ({ name, qty, unit }) => api.addItem(id, name, qty, unit),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['list', id] });
      },
    }
  );
}

export function useToggleItem(listId: string) {
  const api = useListsService();
  const qc = useQueryClient();
  return useMutation<ListItem, Error, { itemId: string }>({
    mutationFn: ({ itemId }) => api.toggleItem(listId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list', listId] }),
  });
}
