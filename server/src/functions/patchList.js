const { app } = require('@azure/functions');
const db = require('../../db/client');
const mem = require('./memoryStore');

app.http('patchList', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'lists/{id}',
  handler: async (request, context) => {
    try {
      const listId = request.params.id;
      let body = null;
      try {
        body = await request.json();
      } catch {
        body = null;
      }
      const { name } = body || {};

      if (!listId || name === undefined) {
        return { status: 400, body: 'Invalid payload: expected { name }' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        await db.updateListName(listId, name);
        return { jsonBody: { id: listId, name } };
      }

      // in-memory update
      mem.updateListName(listId, name);
      return { jsonBody: { id: listId, name } };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  },
});
