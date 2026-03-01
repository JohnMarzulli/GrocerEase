const { app } = require('@azure/functions');
const db = require('../../db/client');
const mem = require('./memoryStore');

app.http('getLists', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'lists',
  handler: async (request, context) => {
    try {
      if (process.env.AZURE_SQL_CONNECTION) {
        const lists = await db.getLists();
        return { jsonBody: lists };
      }

      // in-memory fallback: return everything we stored locally
      return { jsonBody: mem.getLists() };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  }
});
