import { GoceryListManager, isUuid } from '@/core/gocery-list-manager';
import GroceryList from '@/core/grocery-list';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const groceryListManager = new GoceryListManager();

function getValidListId(): string {
  const defaultListId: string = groceryListManager.getDefaultListId();

  try {
    const qs = new URLSearchParams(window.location.search);
    const id = qs.get('id') || defaultListId;

    if (!isUuid(id)) {
      return defaultListId;
    }

    return id;
  } catch {
    return defaultListId;
  }
}

export default function Shopping() {
  // Extract GUID from the query string as listId
  const listId: string = getValidListId();
  const listRef = useRef<HTMLUListElement | null>(null);

  // Resolve the actual list id via the manager using the guid
  const [id, setId] = useState<string>('');
  const list: GroceryList = groceryListManager.getList(listId);
  const listItems = list.getList().items;

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: 32 }}>
        {list.getListName()}
      </header>
      <main className="content">
        <ul className="list" ref={listRef}>
          {(listItems ?? []).map((i) => (
            <li key={i.id} data-item-id={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '150%' }}>
              <input className="interactive-btn" type="checkbox" />
              {i.name}
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <span className="badge">{i.qty} {i.unit}</span>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <div className="footer">
        <div className="footer-bar">
          <Link className="interactive-btn" to="/" style={{ width: '30%', textAlign: 'center', alignContent: 'center', marginRight: 8 }}>Home</Link>
          <Link className="interactive-btn" to="/shopping-selector" style={{ width: '30%', textAlign: 'center', alignContent: 'center', marginLeft: 8 }}>Other Lists</Link>
        </div>
      </div>
    </div>
  );
}