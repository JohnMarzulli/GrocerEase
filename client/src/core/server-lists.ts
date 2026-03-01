import type { ListSummary } from '@/services/types';

const STORAGE_KEY = 'grocarease:serverLists';

function readStorage(): ListSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ListSummary[];
  } catch {
    return [];
  }
}

function writeStorage(list: ListSummary[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getServerLists(): ListSummary[] {
  return readStorage();
}

export function addServerList(summary: ListSummary) {
  const lists = readStorage();
  const exists = lists.find(l => l.id === summary.id);
  if (exists) return;
  lists.push(summary);
  writeStorage(lists);
}

export function removeServerList(id: string) {
  const lists = readStorage().filter(l => l.id !== id);
  writeStorage(lists);
}

export function isServerListId(id: string): boolean {
  return readStorage().some(l => l.id === id);
}
