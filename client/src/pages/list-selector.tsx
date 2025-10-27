import { GoceryListManager } from '@/core/gocery-list-manager';
import GroceryList from '@/core/grocery-list';
import { useCreateList, useLists } from '@/services/hooks';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const groceryListManager = new GoceryListManager();

function getListName(
  listId: string,
) {
  if (!groceryListManager.isListAvailable(listId)) {
    return `Grocery List (New)`;
  }

  const list: GroceryList = groceryListManager.getList(listId);
  return list.getListName();
}

/**
 * Allows the user to select a list to edit, or to create a new one.
 * @returns the HTML to render.
 */
export default function ListSelector() {
  const availableLists = groceryListManager.getAvailableListIds();
  const { data: lists } = useLists();
  const create = useCreateList();
  const navigate = useNavigate();

  const goToList = useCallback((listId: string) => {
    navigate(`/list?id=${listId}`);
  }, [lists, create, navigate]);

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: '3rem', paddingBottom: '5%' }}>GrocerEase</header>
      <button
        className="tile"
        style={{ width: '75%', alignItems: 'center', margin: '0 auto' }}
        onClick={() => goToList(crypto.randomUUID())}>Create New List</button>
      <main className="content">
        <section className="grid2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="list-scroll"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '75vh',
                overflowY: 'scroll', // always show scrollbar
                direction: 'rtl',
                scrollbarWidth: 'thin',
                scrollbarGutter: 'stable',
                scrollMarginLeft: '0.5rem',
                scrollMarginRight: '0.5rem',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {availableLists.map((listId) => (
                <div key={listId} style={{ display: 'flex', alignItems: 'stretch', width: '90%', gap: '0.5rem' }}>
                  <button
                    className="danger-tile"
                    style={{ whiteSpace: 'nowrap', height: '10%', alignSelf: 'center' }}
                    onClick={() => {
                      groceryListManager.removeList(listId);
                      navigate(0);
                    }}
                    aria-label={`Remove ${getListName(listId)}`}
                    title="Remove list">X</button>
                  <button
                    className="tile"
                    style={{ flex: 1, width: '100%', whiteSpace: 'nowrap' }}
                    onClick={() => goToList(listId)}
                  >
                    {getListName(listId)}
                  </button>
                </div>
              ))}
            </div>
        </section>
        <div className="footer">
          <div className="footer-bar">
            <Link className="interactive-btn" to="/" style={{ width: '30%', textAlign: 'center', alignContent: 'center', marginRight: 8 }}>Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}