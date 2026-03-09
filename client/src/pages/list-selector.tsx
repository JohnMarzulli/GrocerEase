import { getItemsText, getListItemCount, getListName, groceryListManager, sortListItems } from '@/core/grocery-list-manager';
import { addServerList, getServerLists } from '@/core/server-lists';
import { useCreateList } from '@/services/hooks';
import { useToast } from '@/state/toast';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="Cloud list" style={{ opacity: 0.7, flexShrink: 0 }}>
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}

function LocalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="Local list" style={{ opacity: 0.7, flexShrink: 0 }}>
    </svg>
  );
}

/**
 * Allows the user to select a list to edit, or to create a new one.
 * @returns the HTML to render.
 */
export default function ListSelector() {
  const availableLists = groceryListManager.getAvailableListIds();
  const create = useCreateList();
  const navigate = useNavigate();
  const serverIds = new Set<string>(getServerLists().map(l => l.id));
  const { show } = useToast();

  const goToList = useCallback((listId: string) => {
    navigate(`/edit?id=${listId}`);
  }, [create, navigate]);

  const [showCreateOptions, setShowCreateOptions] = useState(false);

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: '3rem', paddingBottom: '5%' }}>GrocerEase</header>
      <button
        className="create-tile"
        style={{ width: '90%', alignItems: 'center', margin: '0 auto' }}
        onClick={() => setShowCreateOptions(true)}
      >Create New List</button>
      {showCreateOptions && (
        <div className="create-options" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            className="tile"
            onClick={() => {
              setShowCreateOptions(false);
              const id = crypto.randomUUID();
              goToList(id);
            }}
          >Local</button>
          <button
            className="tile"
            onClick={() => {
              setShowCreateOptions(false);
              const localId = crypto.randomUUID();
              create.mutate('New List', {
                onSuccess: (res) => {
                  addServerList({ ...res, isServer: true });
                  goToList(res.id);
                },
                onError: (err: any) => {
                  const msg = err?.message ?? err;
                  // if the server endpoint is missing or unreachable, fall back to a local list
                  if (msg === 'Failed to fetch' || /^HTTP 404/.test(msg)) {
                    show(`Server unavailable (${import.meta.env.VITE_API_BASE || '/api'}); created local list instead`);
                    goToList(localId);
                  } else {
                    show(`Create failed: ${msg}`);
                  }
                },
              });
            }}
          >Public</button>
          <button
            className="tile"
            onClick={() => setShowCreateOptions(false)}
          >Cancel</button>
        </div>
      )}
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
              className="scrollable-content"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '75vh',
                flex: 1,
                scrollbarColor: 'var(--accent)',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.0rem',
                // leave space so the footer "Home" button never overlaps
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)'
              }}
            >
              {availableLists.sort((a, b) => sortListItems(a, b)).map((listId) => (
                <div key={listId} style={{ display: 'flex', width: '90%', gap: '0.5rem' }}>
                  <button
                    className="list-entry-tile"
                    style={{
                      width: '100%',
                      color: getListItemCount(listId) > 0 ? 'inherit' : 'gray',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      touchAction: 'pan-y',
                      cursor: 'pointer'
                    }}
                    onClick={() => goToList(listId)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      {serverIds.has(listId) ? <CloudIcon /> : <LocalIcon />}
                      {getListName(listId)}
                    </span>
                    <span style={{ fontSize: '0.85em' }}>{getItemsText(listId)}</span>
                  </button>

                  <button
                    className="danger-tile"
                    onClick={() => {
                      groceryListManager.removeList(listId);
                      navigate(0);
                    }}
                    aria-label={`Remove ${getListName(listId)}`}
                    title="Remove list"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="footer">
          <div className="footer-bar">
            <Link className="interactive-btn" to="/" style={{ width: '25%', textAlign: 'center', alignContent: 'center', marginRight: 2 }}>Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
