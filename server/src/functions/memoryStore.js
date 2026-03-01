const crypto = require('crypto');

// Persistent in‑memory store used when AZURE_SQL_CONNECTION is not configured.
// The store is attached to the global object so that the Functions runtime
// doesn't re‑initialize it on every invocation (functions share the same
// process during local development).

const store = global.__GROCEREASE_STORE || { lists: {} };
global.__GROCEREASE_STORE = store;

function createList(name) {
  const id = crypto.randomUUID();
  const list = { id, name: name || 'New List', createdAt: new Date().toISOString(), items: [] };
  store.lists[id] = list;
  return list;
}

function getLists() {
  return Object.values(store.lists).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
}

function getList(id) {
  return store.lists[id] || null;
}

function addItem(listId, name, qty = 1, unit = 'ea') {
  const list = getList(listId);
  if (!list) return null;
  const item = {
    id: crypto.randomUUID(),
    listId,
    name,
    qty,
    unit,
    status: 'pending',
    order: list.items.length,
  };
  list.items.push(item);
  return item;
}

function updateListName(listId, name) {
  const list = getList(listId);
  if (list) list.name = name;
  return list;
}

function modifyItem(listId, itemId, op, payload = {}) {
  const list = getList(listId);
  if (!list) return null;
  const item = list.items.find(i => i.id === itemId);
  if (!item) return null;

  switch (op) {
    case 'toggle':
      item.status = item.status === 'pending' ? 'completed' : 'pending';
      break;
    case 'increment': {
      const step = payload.step || 1;
      item.qty = (item.qty || 0) + step;
      break;
    }
    case 'decrement': {
      const step = payload.step || 1;
      item.qty = (item.qty || 0) - step;
      if (item.qty <= 0) {
        // remove from list
        list.items = list.items.filter(i => i.id !== itemId);
        return null;
      }
      break;
    }
    case 'rename': {
      if (payload.name !== undefined) {
        item.name = payload.name;
      }
      break;
    }
    case 'move': {
      const newOrder = payload.newOrder ?? item.order;
      item.order = newOrder;
      // simple rebalance: sort by order
      list.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      break;
    }
    default:
      break;
  }

  return item;
}

function uploadList(list) {
  store.lists[list.id] = { ...list, items: list.items || [] };
  return { id: list.id, name: list.name, createdAt: list.createdAt };
}

module.exports = { store, createList, getLists, getList, addItem, updateListName, modifyItem, uploadList };
