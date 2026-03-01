import { HttpListsService } from '@/services/impl/http-lists-service';

describe('HttpListsService', () => {
  const OLD_FETCH = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = OLD_FETCH;
  });

  test('uploadList posts to /lists/upload and returns ListSummary', async () => {
    const service = new HttpListsService();

    const fakeResp = { id: 'server-1', name: 'Uploaded', createdAt: new Date().toISOString(), isServer: true };

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
      expect(url).toContain('/lists/upload');
      expect(init?.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body).toHaveProperty('list');
      return Promise.resolve({ ok: true, json: async () => fakeResp });
    });

    const result = await service.uploadList({ id: 'local-1', name: 'L', createdAt: new Date().toISOString(), items: [] } as any);
    expect(result).toEqual(fakeResp);
  });
});