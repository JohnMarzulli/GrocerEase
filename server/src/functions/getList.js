const { app } = require('@azure/functions');
const db = require('../../db/client');
const mem = require('./memoryStore');

app.http('getList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'lists/{id}',
  handler: async (request, context) => {
    try {
      const id = request.params.id;
      if (!id) {
        return { status: 400, body: 'Missing id' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        const list = await db.getList(id);
        if (!list) {
          return { status: 404, body: 'List not found' };
        }
        list.createdAt = list.created_at?.toISOString?.() || list.created_at;
        list.items = (list.items || []).map(i => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          unit: i.unit,
          status: i.status,
          order: i.position
        }));
        return { jsonBody: list };
      }

      // in-memory fallback
      const local = mem.getList(id);
      if (!local) {
        return { status: 404, body: 'List not found' };
      }
      return { jsonBody: local };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  }
});
