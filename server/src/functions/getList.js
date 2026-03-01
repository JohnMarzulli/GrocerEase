const { app } = require('@azure/functions');
const db = require('../../db/client');

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

      return {
        jsonBody: { id, name: 'Simulated List', createdAt: new Date().toISOString(), items: [] }
      };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  }
});
