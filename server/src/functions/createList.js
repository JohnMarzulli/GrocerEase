const { app } = require('@azure/functions');
const db = require('../../db/client');
const crypto = require('crypto');
const mem = require('./memoryStore');

app.http('createList', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'lists',
  handler: async (request, context) => {
    try {
      let body = null;
      try {
        body = await request.json();
      } catch (err) {
        body = null;
      }

      const { name } = body || {};
      if (name === undefined || name === null) {
        return { status: 400, body: 'Invalid payload: expected { name }' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        // generate an id locally so we can return it
        const id = crypto.randomUUID();
        const summary = await db.uploadList({ id, name: name || '', items: [] });
        return { jsonBody: { ...summary, isServer: true } };
      }

      // create and remember in-memory
      const list = mem.createList(name || 'New List');
      return { jsonBody: { ...list, isServer: true } };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  },
});
