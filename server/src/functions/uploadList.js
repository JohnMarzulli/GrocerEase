const { app } = require('@azure/functions');
const db = require('../../db/client');

app.http('uploadList', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'lists/upload',
  handler: async (request, context) => {
    try {
      let body = null;
      try {
        body = await request.json();
      } catch (err) {
        body = null;
      }

      const { list } = body || {};
      if (!list || !list.id || !list.name) {
        return { status: 400, body: 'Invalid payload: expected { list } with id and name' };
      }

      if (process.env.AZURE_SQL_CONNECTION) {
        const summary = await db.uploadList(list);
        return { jsonBody: { ...summary, isServer: true } };
      }

      return {
        jsonBody: {
          id: list.id,
          name: list.name,
          createdAt: list.createdAt ?? new Date().toISOString(),
          isServer: true
        }
      };
    } catch (err) {
      context.log(err);
      return { status: 500, body: err.message };
    }
  }
});
