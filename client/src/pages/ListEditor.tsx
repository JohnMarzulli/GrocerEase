import { Link } from 'react-router-dom';
import { useAddItem, useList, useToggleItem, useCreateList } from '@/services/hooks';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { getCookie, setCookie, LIST_COOKIE } from '@/utils/cookies';
import { useToast } from '@/state/toast';

export default function ListEditor() {
  const [id, setId] = useState<string | undefined>(() => getCookie(LIST_COOKIE) || undefined);
  const { data: _list, isLoading, error } = useList(id, { enabled: !!id });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savedName, setSavedName] = useState<string | undefined>(undefined);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // Long-press to enable name editing
  useEffect(() => {
    if (!_list?.name) return;
    const header = document.querySelector('.mobile-shell .header') as HTMLElement | null;
    if (!header) return;

    let timer: any;
    const start = () => {
      timer = setTimeout(() => {
        setNameInput(savedName ?? _list.name);
        setEditingName(true);
      }, 500);
    };
    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    header.addEventListener('mousedown', start);
    header.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mouseup', cancel);
    window.addEventListener('touchend', cancel);
    window.addEventListener('touchcancel', cancel);

    return () => {
      cancel();
      header.removeEventListener('mousedown', start);
      header.removeEventListener('touchstart', start);
      window.removeEventListener('mouseup', cancel);
      window.removeEventListener('touchend', cancel);
      window.removeEventListener('touchcancel', cancel);
    };
  }, [_list?.name, savedName]);

  // Add +/- controls per item and long-press-to-edit item names
  useEffect(() => {
    if (!_list?.items?.length) return;
    const listEl = document.querySelector('.mobile-shell .list') as HTMLElement | null;
    if (!listEl) return;

    // Ensure controls exist on each <li>
    const ensureControls = () => {
      listEl.querySelectorAll('li').forEach((li) => {
        const el = li as HTMLElement;
        if (el.dataset.controlsAttached === '1') return;

        //const badge = el.querySelector('.badge');
        // Create - and + buttons
        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'button';
        dec.textContent = '−';
        dec.setAttribute('data-action', 'dec');

        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'button';
        inc.textContent = '+';
        inc.setAttribute('data-action', 'inc');

        el.appendChild(dec);
        el.appendChild(inc);

        el.dataset.controlsAttached = '1';
      });
    };

    const parseBadge = (badge: Element | null) => {
      const txt = (badge?.textContent ?? '').trim();
      if (!txt) return { qty: 0, unit: '' };
      const [first, ...rest] = txt.split(/\s+/);
      const qty = Number.parseInt(first, 10) || 0;
      const unit = rest.join(' ');
      return { qty, unit };
    };

    const updateBadge = (badge: Element | null, qty: number, unit: string) => {
      if (!badge) return;
      (badge as HTMLElement).textContent = unit ? `${qty} ${unit}` : String(qty);
    };

    ensureControls();

    // Click handling for +/- via delegation
    const clickHandler = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.matches('button[data-action="inc"], button[data-action="dec"]')) {
        e.preventDefault();
        const li = t.closest('li');
        if (!li) return;
        const badge = li.querySelector('.badge');
        const { qty, unit } = parseBadge(badge);
        const inc = t.getAttribute('data-action') === 'inc';
        const next = inc ? qty + 1 : qty - 1;
        if (next <= 0) {
          // Remove item from UI when qty hits 0
          li.remove();
          return;
        }
        updateBadge(badge, next, unit);
      }
    };

    // Long-press on the item name span to edit
    let lpTimer: any = null;
    const startLongPress = (span: HTMLElement) => {
      if (lpTimer) clearTimeout(lpTimer);
      lpTimer = setTimeout(() => {
        const initial = span.textContent ?? '';
        const input = document.createElement('input');
        input.className = 'input';
        input.value = initial;
        input.style.background = 'transparent';
        input.style.width = '100%';
        input.style.maxWidth = '100%';
        input.addEventListener('keydown', (ke: KeyboardEvent) => {
          if (ke.key === 'Enter') (ke.target as HTMLInputElement).blur();
          if (ke.key === 'Escape') {
            // cancel, restore original span
            if (input.parentElement) {
              input.replaceWith(span);
            }
          }
        });
        input.addEventListener('blur', () => {
          const v = input.value.trim() || initial;
          const newSpan = document.createElement('span');
          newSpan.textContent = v;
          // preserve line-through if it was completed
          newSpan.style.textDecoration = span.style.textDecoration;
          input.replaceWith(newSpan);
        });
        span.replaceWith(input);
        setTimeout(() => input.select(), 0);
      }, 500);
    };
    const cancelLongPress = () => {
      if (lpTimer) {
        clearTimeout(lpTimer);
        lpTimer = null;
      }
    };

    const pointerDown = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      // Match the first name span (exclude .badge)
      if (t.tagName === 'SPAN' && !t.classList.contains('badge')) {
        startLongPress(t);
      }
    };

    listEl.addEventListener('click', clickHandler);
    listEl.addEventListener('mousedown', pointerDown);
    listEl.addEventListener('touchstart', pointerDown, { passive: true } as any);
    window.addEventListener('mouseup', cancelLongPress);
    window.addEventListener('touchend', cancelLongPress);
    window.addEventListener('touchcancel', cancelLongPress);

    // If the list content changes, re-inject controls
    const mo = new MutationObserver(() => ensureControls());
    mo.observe(listEl, { childList: true, subtree: true });

    return () => {
      listEl.removeEventListener('click', clickHandler);
      listEl.removeEventListener('mousedown', pointerDown);
      listEl.removeEventListener('touchstart', pointerDown as any);
      window.removeEventListener('mouseup', cancelLongPress);
      window.removeEventListener('touchend', cancelLongPress);
      window.removeEventListener('touchcancel', cancelLongPress);
      mo.disconnect();
    };
  }, [_list?.items?.length]);

  const handleNameCommit = () => {
    const next = nameInput.trim() || (_list?.name ?? '');
    setSavedName(next);
    setEditingName(false);
  };

  const list: any = _list
    ? {
        ..._list,
        name: editingName ? (
          <input
            ref={nameInputRef}
            className="input"
            style={{ fontSize: 32, textAlign: 'center', width: '100%', background: 'transparent' }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setEditingName(false);
              }
            }}
          />
        ) : savedName ?? _list.name,
      }
    : _list;
  const addItem = useAddItem(id ?? '');
  const create = useCreateList();
  const { show } = useToast();
  const [text, setText] = useState('');
  const creatingRef = useRef(false);

  // Save loaded list id to cookie
  useEffect(() => {
    if (list?.id) {
      setCookie(LIST_COOKIE, list.id);
    }
  }, [list?.id]);

  // If list fetch fails (e.g., not found), create a new one and use it
  useEffect(() => {
    if (error && !creatingRef.current) {
      creatingRef.current = true;
      create.mutate('Grocery List', {
        onSuccess: (l) => {
          setCookie(LIST_COOKIE, l.id);
          show('New list created');
          setId(l.id);
        },
        onError: () => {
          creatingRef.current = false;
        },
      });
    }
  }, [error, create, show]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = text.trim();
    if (!name) return;
    addItem.mutate({ name }, { onSuccess: () => setText('') });
  };

  // Skeleton while loading or creating a new list
  if (!list) {
    return (
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
  }

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: 32 }}>{list.name}</header>
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

        <ul className="list">
          {list.items.map((i) => (
            <li key={i.id}>
              <span style={{ textDecoration: i.status === 'completed' ? 'line-through' : 'none' }}>{i.name}</span>
              <span className="badge">{i.qty} {i.unit}</span>
            </li>
          ))}
        </ul>
      </main>

      <div className="footer">
        <div className="footer-bar">
          <Link className="home-btn" to="/">Home</Link>
        </div>
      </div>
    </div>
  );
}
