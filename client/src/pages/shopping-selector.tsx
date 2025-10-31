import { getItemsText, getListItemCount, getListName, groceryListManager, sortListItems } from '@/core/grocery-list-manager';
import { useCreateList, useLists } from '@/services/hooks';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Allows the user to select a list to edit, or to create a new one.
 * @returns the HTML to render.
 */
export default function ShoppingSelector() {
  const availableLists = groceryListManager.getAvailableListIds();
  const { data: lists } = useLists();
  const create = useCreateList();
  const navigate = useNavigate();

  const goToList = useCallback((listId: string) => {
    navigate(`/shopping?id=${listId}`);
  }, [lists, create, navigate]);

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: '3rem', paddingBottom: '5%' }}>GrocerEase</header>
      <main className="content">
        <section className="grid2" style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              className="list-scroll"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '75vh',
                flex: 1,
                overflowY: 'auto',
                direction: 'rtl',
                scrollbarColor: '#519b54ff transparent',
                scrollbarWidth: 'thin',
                scrollbarGutter: 'stable',
                scrollMarginLeft: '0.5rem',
                scrollMarginRight: '0.5rem',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.0rem',
                // leave space so the footer "Home" button never overlaps
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
              }}
            >
              {availableLists.filter((listId) => getListItemCount(listId) > 0).sort((a, b) => sortListItems(a, b)).map((listId) => (
                <div key={listId} style={{ display: 'flex', alignItems: 'stretch', width: '90%', gap: '0.5rem' }}>
                  <button
                    className="tile"
                    style={{ flex: 1, width: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                    onClick={() => goToList(listId)}
                  >
                    {getListName(listId)}<br />
                    {getItemsText(listId)}
                  </button>
                </div>
              ))}
            </div>
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