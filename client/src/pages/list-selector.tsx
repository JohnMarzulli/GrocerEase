import { getItemsText, getListItemCount, getListName, groceryListManager, sortListItems } from '@/core/grocery-list-manager';
import { useCreateList, useLists, useUploadLocalList } from '@/services/hooks';
import { getServerLists, addServerList } from '@/core/server-lists';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/state/toast';;

/**
 * Allows the user to select a list to edit, or to create a new one.
 * @returns the HTML to render.
 */
export default function ListSelector() {
  const availableLists = groceryListManager.getAvailableListIds();
  const { data: lists } = useLists();
  const create = useCreateList();
  const uploadLocal = useUploadLocalList();
  const navigate = useNavigate();
  const serverIds = new Set<string>([...(lists ?? []).map(l => l.id), ...getServerLists().map(l => l.id)]);
  const { show } = useToast();

  const goToList = useCallback((listId: string) => {
    navigate(`/edit?id=${listId}`);
  }, [lists, create, navigate]);

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
                      touchAction: 'pan-y', // Enable vertical touch scrolling
                      cursor: 'pointer'
                    }}
                    onClick={() => goToList(listId)}
                  >
                    {getListName(listId)}<br />
                    {getItemsText(listId)}
                  </button>
                  {!serverIds.has(listId) && (
                    <button
                      className="primary-tile"
                      onClick={() => {
                        uploadLocal.mutate({ listId }, {
                          onSuccess: () => { show('Uploaded to server'); navigate(0); },
                          onError: (err: any) => show(`Upload failed: ${err?.message ?? err}`),
                        });
                      }}
                      disabled={uploadLocal.isPending}
                      aria-label={`Upload ${getListName(listId)} to server`}
                      title="Upload to server"
                    >
                      {uploadLocal.isPending ? 'Uploading�' : '?'}
                    </button>
                  )}

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