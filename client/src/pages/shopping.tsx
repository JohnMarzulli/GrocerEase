import { getValidListIdFromQueryParams } from '@/core/grocery-list-manager';
import { isServerListId } from '@/core/server-lists';
import { useList, useToggleItem } from '@/services/hooks';
import { compareListItems } from '@/services/types';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';


export default function Shopping() {
  const listId: string = getValidListIdFromQueryParams();
  const listRef = useRef<HTMLUListElement | null>(null);
  const isServer = isServerListId(listId);
  const navigate = useNavigate();

  const { data: listData, isLoading } = useList(listId, { enabled: !!listId });
  const toggleItem = useToggleItem(listId);

  if (!listId || isLoading) {
    return <div className="mobile-shell" />;
  }

  const listItems = (listData?.items ?? []).slice().sort(compareListItems);

  const handleToggle = (itemId: string) => {
    if (isServer) {
      toggleItem.mutate({ itemId });
    } else {
      // local: delegate to mutation which handles localStorage directly
      toggleItem.mutate({ itemId }, { onSuccess: () => navigate(0) });
    }
  };

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: 32 }}>
        {listData?.name ?? 'Grocery List'}
      </header>
      <main className="content scrollable-content">
        <ul className="list" ref={listRef} style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          {listItems.map((i) => (
            <li key={i.id} data-item-id={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '150%' }}>
              <input
                className="interactive-btn"
                type="checkbox"
                checked={i.status === 'completed'}
                onChange={() => handleToggle(i.id)}
              />
              <span className="item-text" style={{ textDecoration: (i.status === 'completed' ? 'line-through' : ''), color: (i.status === 'completed' ? 'gray' : '') }}>{i.name}</span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <span className="badge">{i.qty} {i.unit}</span>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <div className="footer">
        <div className="footer-bar">
          <Link className="interactive-btn" to="/" style={{ width: '25%', textAlign: 'center', alignContent: 'center', marginRight: 2 }}>Home</Link>
          <Link className="interactive-btn" to={`/edit?id=${encodeURIComponent(listId)}`} style={{ width: '25%', textAlign: 'center', alignContent: 'center', marginRight: 2 }}>Edit</Link>
          <Link className="interactive-btn" to="/shopping-selector" style={{ width: '25%', textAlign: 'center', alignContent: 'center' }}>Other Lists</Link>
        </div>
      </div>
    </div>
  );
}
