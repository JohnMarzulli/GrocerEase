import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens';
import type { ListsService } from '@/services/types';
import { MockListsService } from '@/services/impl/MockListsService';
import { SimulatedListsService } from '@/services/impl/SimulatedListsService';
import { HttpListsService } from '@/services/impl/HttpListsService';

const mode = (import.meta as any).env?.VITE_API_MODE || 'sim';

let listsImpl: new () => ListsService;
if (mode === 'mock') {
  listsImpl = MockListsService;
} else if (mode === 'http') {
  listsImpl = HttpListsService;
} else {
  listsImpl = SimulatedListsService;
}

container.register<ListsService>(TOKENS.ListsService, { useClass: listsImpl });

export { container };
