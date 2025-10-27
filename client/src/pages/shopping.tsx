import { getValidListIdFromQueryParams, groceryListManager } from '@/core/gocery-list-manager';
import GroceryList from '@/core/grocery-list';
import { useRef } from 'react';
import { Link } from 'react-router-dom';


export default function Shopping() {
  // Extract GUID from the query string as listId
  const listId: string = getValidListIdFromQueryParams();
  const listRef = useRef<HTMLUListElement | null>(null);

  // Resolve the actual list id via the manager using the guid
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