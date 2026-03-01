const { app } = require('@azure/functions');
const db = require('../../db/client');
const crypto = require('crypto');
const mem = require('./memoryStore');

app.http('addItem', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'lists/{id}/items',
  handler: async (request, context) => {
    try {
      const listId = request.params.id;
      let body = null;
      try {
        body = await request.json();
      } catch {
        body = null;
      }
      const { name, qty, unit } = body || {};
      if (!listId || !name) {
        return { status: 400, body: 'Missing list id or item name' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        const item = await db.addItem(listId, name, qty, unit);
        return { jsonBody: item };
      }

      // in-memory fallback - persist item in store
      const item = mem.addItem(listId, name, qty, unit);
      if (!item) {
        return { status: 404, body: 'List not found' };
      }
      return { jsonBody: item };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  },
});
