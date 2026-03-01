const { app } = require('@azure/functions');
const db = require('../../db/client');
const mem = require('./memoryStore');

app.http('patchListItem', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'list-items/{id}',
  handler: async (request, context) => {
    try {
      const itemId = request.params.id;
      let body = null;
      try {
        body = await request.json();
      } catch {
        body = null;
      }
      const { op, listId, name, step, newOrder } = body || {};
      if (!itemId || !op) {
        return { status: 400, body: 'Invalid payload: expected { op, listId }' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        const item = await db.modifyItem(listId, itemId, op, { name, step, newOrder });
        if (!item) return { status: 404, body: 'Item not found' };
        return { jsonBody: item };
      }

      // in-memory simulation
      const item = mem.modifyItem(listId, itemId, op, { name, step, newOrder });
      if (!item) {
        return { status: 404, body: 'Item not found' };
      }
      return { jsonBody: item };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  },
});
