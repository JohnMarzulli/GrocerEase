const { app } = require('@azure/functions');
const db = require('../../db/client');

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

      return {
        jsonBody: [
          { id: 'server-1', name: 'Sample Server List', createdAt: new Date().toISOString() }
        ]
      };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  }
});
