import { MockListsService } from '@/services/impl/mock-lists-service';
import { SimulatedListsService } from '@/services/impl/simulated-lists-service';

describe('ListsService.uploadList', () => {
  test('MockListsService.uploadList creates a server list summary', async () => {
    const svc = new MockListsService();

    const sampleList = {
      id: 'local-1',
      name: 'Local Upload',
      createdAt: new Date().toISOString(),
      items: [
        { id: crypto.randomUUID(), name: 'Eggs', qty: 12, unit: 'ea', status: 'pending', order: 0 }
      ]
    } as any;

    const res = await svc.uploadList(sampleList);
    expect(res).toHaveProperty('id');
    expect(res).toHaveProperty('name', 'Local Upload');
    expect(res).toHaveProperty('isServer', true);
  });

  test('SimulatedListsService.uploadList returns server-marked summary', async () => {
    const svc = new SimulatedListsService();
    const sampleList = {
      id: 'local-2',
      name: 'Local Upload 2',
      createdAt: new Date().toISOString(),
      items: [
        { id: crypto.randomUUID(), name: 'Eggs', qty: 12, unit: 'ea', status: 'pending', order: 0 }
      ]
    } as any;

    const res = await svc.uploadList(sampleList as any);
    expect(res).toHaveProperty('id', 'local-2');
    expect(res).toHaveProperty('name', 'Local Upload 2');
    expect(res).toHaveProperty('isServer', true);
  });
});