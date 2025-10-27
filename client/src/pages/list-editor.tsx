import { GoceryListManager } from '@/core/gocery-list-manager';
import { useAddItem, useDecrementItem, useIncrementItem, useList, useMoveItem, useRenameItem, useRenameList } from '@/services/hooks';
import { useToast } from '@/state/toast';
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const groceryListManager = new GoceryListManager();

function getValidListId(): string {
  const defaultListId: string = groceryListManager.getDefaultListId();

  try {
    const qs = new URLSearchParams(window.location.search);
    const id = qs.get('id') || defaultListId;

    // $TODO - Should we navigate or update the url to the id that is being shown?
    return groceryListManager.isListAvailable(id)
      ? id
      : defaultListId;
  } catch {
    return defaultListId;
  }
}

export default function ListEditor() {
  // Extract GUID from the query string as listId
  const listId: string = getValidListId();

  // Resolve the actual list id via the manager using the guid
  const [id, setId] = useState<string>('');
  useEffect(() => {
    //const resolvedId = groceryListManager.getList(listId);
    setId(listId);
  }, [listId]);

  const { data: _list, isLoading, error } = useList(id, { enabled: !!id });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // simple inline rename UI
  const rename = useRenameList(id || '');

  const handleNameCommit = () => {
    const next = nameInput.trim() || 'Grocery List';
    setEditingName(false);
    if (id) rename.mutate({ name: next });
  };

  const list = _list;
  const addItem = useAddItem(id ?? '');
  const inc = useIncrementItem(id ?? '');
  const dec = useDecrementItem(id ?? '');
  const renameItem = useRenameItem(id ?? '');
  const { show } = useToast();
  const [text, setText] = useState('');
  const creatingRef = useRef(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const moveItem = useMoveItem(id ?? '');
  const listRef = useRef<HTMLUListElement | null>(null);
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());
  const floatingRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<number>(0);

  const startDrag = (e: any, itemId: string) => {
    e.preventDefault();
    setDraggingId(itemId);
    setDragStartY(e.clientY ?? 0);
    setDragCurrentY(e.clientY ?? 0);

    const ul = listRef.current;
    const li = ul?.querySelector(`li[data-item-id="${itemId}"]`) as HTMLElement | null;
    if (!li) return;
    const rect = li.getBoundingClientRect();
    dragOffsetRef.current = (e.clientY ?? 0) - rect.top;

    // clone the node to create a floating preview
    const clone = li.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.classList.add('dragging-floating');
    document.body.appendChild(clone);
    floatingRef.current = clone;

    // hide original while floating exists so FLIP animates the gap
    li.style.visibility = 'hidden';
    // try pointer capture if available on target
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { }
  };

  // Handle drag and drop (track pointer, highlight target, commit on pointer up)
  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (e: PointerEvent) => {
      if (!list) return;
      const { items } = list;
      const draggingItem = items.find(i => i.id === draggingId);
      if (!draggingItem) return;

      // move floating preview if present
      const floatEl = floatingRef.current;
      if (floatEl) {
        const x = floatEl.getBoundingClientRect().left;
        const top = (e.clientY ?? 0) - dragOffsetRef.current;
        floatEl.style.transform = `translateY(${top - floatEl.getBoundingClientRect().top}px)`;
        floatEl.style.top = `${top}px`;
      }

      // Find potential target by Y position
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('li');
      if (targetEl) {
        const targetId = targetEl.getAttribute('data-item-id');
        if (targetId && targetId !== draggingId) {
          const targetItem = items.find(i => i.id === targetId);
          if (targetItem) {
            setDragTargetId(targetId);
          }
        }
      }
      setDragCurrentY(e.clientY ?? 0);
    };

    const handleUp = (ev?: PointerEvent) => {
      // remove floating preview and restore original visibility
      const floatEl = floatingRef.current;
      if (floatEl) {
        const ul = listRef.current;
        const original = ul?.querySelector(`li[data-item-id="${draggingId}"]`) as HTMLElement | null;
        original && (original.style.visibility = 'visible');
        floatEl.remove();
        floatingRef.current = null;
      }

      if (dragTargetId && draggingId) {
        const items = list?.items ?? [];
        const fromIdx = items.findIndex(i => i.id === draggingId);
        const toIdx = items.findIndex(i => i.id === dragTargetId);
        if (fromIdx !== -1 && toIdx !== -1) {
          moveItem.mutate({ itemId: draggingId, newOrder: items[toIdx].order });
        }
      }
      setDraggingId(null);
      setDragTargetId(null);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [draggingId, dragTargetId, list, moveItem]);

  // FLIP animation: measure positions and animate differences when list.items changes
  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;

    const newPositions = new Map<string, DOMRect>();
    ul.querySelectorAll('li').forEach((el) => {
      const id = el.getAttribute('data-item-id');
      if (!id) return;
      newPositions.set(id, (el as HTMLElement).getBoundingClientRect());
    });

    const prev = positionsRef.current;
    if (prev.size) {
      newPositions.forEach((newRect, id) => {
        const prevRect = prev.get(id);
        if (!prevRect) return;
        const deltaY = prevRect.top - newRect.top;
        if (deltaY) {
          const li = ul.querySelector(`li[data-item-id="${id}"]`) as HTMLElement | null;
          if (!li) return;
          // Invert
          li.style.transition = 'none';
          li.style.transform = `translateY(${deltaY}px)`;
          // Play
          requestAnimationFrame(() => {
            li.style.transition = 'transform 220ms cubic-bezier(.2,.9,.2,1)';
            li.style.transform = '';
          });
          const cleanup = () => {
            if (li) {
              li.style.transition = '';
              li.style.transform = '';
            }
            li?.removeEventListener('transitionend', cleanup);
          };
          li.addEventListener('transitionend', cleanup);
        }
      });
    }

    // Save positions for next round
    positionsRef.current = newPositions;
  }, [list?.items]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = text.trim();
    if (!name) return;
    addItem.mutate({ name }, { onSuccess: () => setText('') });
  };

  // Skeleton while loading or creating a new list
  if (!list) {
    return listLoadingSkeleton;
  }

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: 32 }}>
        {editingName ? (
          <input
            ref={nameInputRef}
            className="input"
            style={{ fontSize: 28, textAlign: 'center', width: '100%', background: 'transparent' }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingName(false);
            }}
          />
        ) : (
          <>
            {(() => {
              let timer: number | null = null;

              const start = () => {
                if (timer) window.clearTimeout(timer);
                timer = window.setTimeout(() => {
                  timer = null;
                  setNameInput(list.name);
                  setEditingName(true);
                }, 500);
              };

              const cancel = () => {
                if (timer) {
                  window.clearTimeout(timer);
                  timer = null;
                }
              };

              return (
                <span
                  onPointerDown={start}
                  onPointerUp={cancel}
                  onPointerLeave={cancel}
                  onPointerCancel={cancel}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', cursor: 'default' }}
                  title="Long-press to rename"
                >
                  {list.name}
                </span>
              );
            })()}
          </>
        )}
      </header>
      <main className="content">
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="New Item Name"
          />
          <button className="button" type="submit" disabled={addItem.isPending}>
            {addItem.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>

        <ul className="list" ref={listRef}>
          {list.items.map((i) => (
            <li
              key={i.id}
              data-item-id={i.id}
              className={`${draggingId === i.id ? 'dragging' : ''} ${dragTargetId === i.id ? 'drag-target' : ''}`}
            >
              <div
                className="drag-handle"
                onPointerDown={(e) => startDrag(e, i.id)}
              >
                {[...Array(6)].map((_, idx) => (
                  <i key={idx} />
                ))}
              </div>
              {editingItemId === i.id ? (
                <input
                  className="input"
                  style={{ background: 'transparent' }}
                  autoFocus
                  value={editingItemText}
                  onChange={(e) => setEditingItemText(e.target.value)}
                  onBlur={() => {
                    const next = editingItemText.trim();
                    if (next && next !== i.name) renameItem.mutate({ itemId: i.id, name: next });
                    setEditingItemId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingItemId(null);
                  }}
                />
              ) : (
                (() => {
                  let t: number | null = null;
                  const start = () => {
                    if (t) clearTimeout(t);
                    t = window.setTimeout(() => {
                      t = null;
                      setEditingItemId(i.id);
                      setEditingItemText(i.name);
                    }, 500);
                  };
                  const cancel = () => { if (t) { clearTimeout(t); t = null; } };
                  return (
                    <span
                      onPointerDown={start}
                      onPointerUp={cancel}
                      onPointerLeave={cancel}
                      onPointerCancel={cancel}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ textDecoration: i.status === 'completed' ? 'line-through' : 'none', userSelect: 'none', cursor: 'default' }}
                      title="Long-press to rename"
                    >
                      {i.name}
                    </span>
                  );
                })()
              )}
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <span className="badge">{i.qty} {i.unit}</span>
                <button className="interactive-btn" type="button" onClick={() => dec.mutate({ itemId: i.id })}>-</button>
                <button className="interactive-btn" type="button" onClick={() => inc.mutate({ itemId: i.id })}>+</button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <div className="footer">
        <div className="footer-bar">
          <Link className="interactive-btn" to="/">Home</Link>
        </div>
      </div>
    </div>
  );
}

const listLoadingSkeleton = (
  <div className="mobile-shell">
    <header className="header" style={{ textAlign: 'center', fontSize: 32 }}>
      <div className="skel-line shimmer" style={{ width: '50%', height: 32, margin: '0 auto' }} />
    </header>
    <main className="content">
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skel-input shimmer" />
        <div className="skel-chip shimmer" />
      </div>
      <ul className="list">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <div className="skel-line shimmer" style={{ width: '60%' }} />
            <div className="skel-line shimmer" style={{ width: 48, height: 14, marginLeft: 'auto' }} />
          </li>
        ))}
      </ul>
    </main>
    <div className="footer">
      <div className="footer-bar">
        <span className="skel-chip shimmer" />
      </div>
    </div>
  </div>
);