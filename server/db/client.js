const crypto = require('crypto');
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

let pool;

function parseConnString(connStr) {
  // A tiny parser for key=value; pairs (not robust for all edge cases, but OK here)
  const out = {};
  connStr.split(';').forEach(part => {
    const [k, ...v] = part.split('=');
    if (!k) return;
    out[k.trim().toLowerCase()] = v.join('=').trim();
  });
  return out;
}

async function getPool() {
  if (pool) return pool;

  const connStr = process.env.AZURE_SQL_CONNECTION;
  if (!connStr) throw new Error('AZURE_SQL_CONNECTION not configured');

  const lower = connStr.toLowerCase();
  const useAad = lower.includes('authentication') && lower.includes('active directory');

  if (useAad) {
    // Use Managed Identity / DefaultAzureCredential
    const parts = parseConnString(connStr);
    const server = parts['server'] || parts['data source'] || parts['server'];
    const database = parts['initial catalog'] || parts['database'];

    if (!server || !database) throw new Error('Invalid AZURE_SQL_CONNECTION; server and database required');

    // Acquire token
    const cred = new DefaultAzureCredential();
    const tokenResponse = await cred.getToken('https://database.windows.net/.default');
    if (!tokenResponse) throw new Error('Failed to acquire AAD token for Azure SQL');

    const config = {
      server: server.replace('tcp:', '').replace(',1433', ''),
      options: {
        encrypt: true,
        database: database,
        trustServerCertificate: false
      },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: tokenResponse.token
        }
      }
    };

    pool = await sql.connect(config);
    return pool;
  }

  // Fallback: use raw connection string
  pool = await sql.connect(connStr);
  return pool;
}

async function getLists() {
  const p = await getPool();
  const res = await p.request().query('SELECT id, name, created_at FROM dbo.lists ORDER BY created_at DESC');
  return res.recordset;
}

async function getList(id) {
  const p = await getPool();
  const listRes = await p.request().input('id', sql.UniqueIdentifier, id).query('SELECT id, name, created_at FROM dbo.lists WHERE id = @id');
  if (!listRes.recordset.length) return null;
  const list = listRes.recordset[0];
  const itemsRes = await p.request().input('listId', sql.UniqueIdentifier, id).query('SELECT id, name, qty, unit, status, position, created_at FROM dbo.items WHERE list_id = @listId ORDER BY position');
  list.items = itemsRes.recordset;
  return list;
}

// Upload list: create list row and items in a transaction
async function uploadList(list) {
  const p = await getPool();
  const tx = new sql.Transaction(p);
  await tx.begin();
  try {
    const tReq = tx.request();
    const id = list.id || sql.UniqueIdentifier;
    // If id provided, insert with that id, else SQL will generate
    const insertListSql = list.id ? 'INSERT INTO dbo.lists (id, name, created_at) VALUES (@id, @name, @createdAt)' : 'INSERT INTO dbo.lists (name, created_at) VALUES (@name, @createdAt); SELECT SCOPE_IDENTITY() AS id;';
    tReq.input('id', sql.UniqueIdentifier, list.id);
    tReq.input('name', sql.NVarChar(255), list.name);
    tReq.input('createdAt', sql.DateTimeOffset, list.createdAt ? new Date(list.createdAt) : new Date());

    if (list.id) {
      await tReq.query(insertListSql);
    } else {
      const r = await tReq.query(insertListSql);
      // If SQL generated id, get it back
      // Note: SCOPE_IDENTITY() returns numeric; if you prefer GUID generation in SQL, use NEWID() and return it explicitly
      // For simplicity assume id provided by client
    }

    // Insert items
    if (Array.isArray(list.items)) {
      for (const item of list.items) {
        const iReq = tx.request();
        iReq.input('id', sql.UniqueIdentifier, item.id);
        iReq.input('listId', sql.UniqueIdentifier, list.id);
        iReq.input('name', sql.NVarChar(255), item.name);
        iReq.input('qty', sql.Int, item.qty ?? 1);
        iReq.input('unit', sql.NVarChar(30), item.unit ?? 'ea');
        iReq.input('status', sql.NVarChar(20), item.status ?? 'pending');
        iReq.input('position', sql.Int, item.order ?? 0);
        await iReq.query('INSERT INTO dbo.items (id, list_id, name, qty, unit, status, position, created_at, updated_at) VALUES (@id, @listId, @name, @qty, @unit, @status, @position, SYSUTCDATETIME(), SYSUTCDATETIME())');
      }
    }

    await tx.commit();
    return { id: list.id, name: list.name, createdAt: list.createdAt };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

// Add helpers for list/item mutations

async function addItem(listId, name, qty = 1, unit = 'ea') {
  const p = await getPool();
  const itemId = crypto.randomUUID();
  const safeQty = Math.max(1, Number(qty) || 1);
  const safeUnit = unit || 'ea';

  // Get current max position so the new item appends at the end
  const posRes = await p.request()
    .input('listId', sql.UniqueIdentifier, listId)
    .query('SELECT COALESCE(MAX(position), -1) AS maxPos FROM dbo.items WHERE list_id = @listId');
  const position = (posRes.recordset[0]?.maxPos ?? -1) + 1;

  await p.request()
    .input('id', sql.UniqueIdentifier, itemId)
    .input('listId', sql.UniqueIdentifier, listId)
    .input('name', sql.NVarChar(255), name)
    .input('qty', sql.Int, safeQty)
    .input('unit', sql.NVarChar(30), safeUnit)
    .input('status', sql.NVarChar(20), 'pending')
    .input('position', sql.Int, position)
    .query('INSERT INTO dbo.items (id, list_id, name, qty, unit, status, position, created_at, updated_at) VALUES (@id, @listId, @name, @qty, @unit, @status, @position, SYSUTCDATETIME(), SYSUTCDATETIME())');

  return { id: itemId, name, qty: safeQty, unit: safeUnit, status: 'pending', order: position };
}

async function updateListName(listId, name) {
  const p = await getPool();
  await p.request()
    .input('id', sql.UniqueIdentifier, listId)
    .input('name', sql.NVarChar(255), name)
    .query('UPDATE dbo.lists SET name = @name WHERE id = @id');
}

async function modifyItem(listId, itemId, op, payload = {}) {
  const p = await getPool();
  // Ensure the item belongs to the list
  const itemRes = await p.request()
    .input('id', sql.UniqueIdentifier, itemId)
    .input('listId', sql.UniqueIdentifier, listId)
    .query('SELECT * FROM dbo.items WHERE id = @id AND list_id = @listId');
  if (!itemRes.recordset.length) return null;
  const item = itemRes.recordset[0];

  switch (op) {
    case 'toggle': {
      const newStatus = item.status === 'pending' ? 'completed' : 'pending';
      await p.request()
        .input('id', sql.UniqueIdentifier, itemId)
        .input('status', sql.NVarChar(20), newStatus)
        .query('UPDATE dbo.items SET status = @status WHERE id = @id');
      item.status = newStatus;
      break;
    }
    case 'increment': {
      const step = payload.step || 1;
      const newQty = (item.qty || 0) + step;
      await p.request()
        .input('id', sql.UniqueIdentifier, itemId)
        .input('qty', sql.Int, newQty)
        .query('UPDATE dbo.items SET qty = @qty WHERE id = @id');
      item.qty = newQty;
      break;
    }
    case 'decrement': {
      const step = payload.step || 1;
      const newQty = (item.qty || 0) - step;
      if (newQty <= 0) {
        // delete item
        await p.request()
          .input('id', sql.UniqueIdentifier, itemId)
          .query('DELETE FROM dbo.items WHERE id = @id');
        return null;
      }
      await p.request()
        .input('id', sql.UniqueIdentifier, itemId)
        .input('qty', sql.Int, newQty)
        .query('UPDATE dbo.items SET qty = @qty WHERE id = @id');
      item.qty = newQty;
      break;
    }
    case 'rename': {
      const name = payload.name || '';
      await p.request()
        .input('id', sql.UniqueIdentifier, itemId)
        .input('name', sql.NVarChar(255), name)
        .query('UPDATE dbo.items SET name = @name WHERE id = @id');
      item.name = name;
      break;
    }
    case 'move': {
      const newOrder = payload.newOrder || 0;
      await p.request()
        .input('id', sql.UniqueIdentifier, itemId)
        .input('position', sql.Int, newOrder)
        .query('UPDATE dbo.items SET position = @position WHERE id = @id');
      item.position = newOrder;
      break;
    }
    case 'refresh': {
      // no-op for now
      break;
    }
    default:
      throw new Error(`Unsupported op ${op}`);
  }
  // Map DB column name to the field name the client expects
  return { ...item, order: item.position };
}

module.exports = { getLists, getList, uploadList, addItem, updateListName, modifyItem };
