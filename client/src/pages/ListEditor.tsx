import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAddItem, useList, useToggleItem, useCreateList } from '@/services/hooks';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { setCookie, LIST_COOKIE } from '@/utils/cookies';
import { useToast } from '@/state/toast';

export default function ListEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id!;
  const { data: list, isLoading, error } = useList(id);
  const addItem = useAddItem(id);
  const toggle = useToggleItem(id);
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

  // If list fetch fails (e.g., not found), create a new one and navigate
  useEffect(() => {
    if (error && !creatingRef.current) {
      creatingRef.current = true;

      // Install a global long-press handler on the header (list name) to allow renaming
      if (!(window as any).__geLongPressInstalled) {
        (window as any).__geLongPressInstalled = true;

        let pressTimer: number | null = null;

        const isHeader = (el: EventTarget | null) =>
          el instanceof HTMLElement && el.classList.contains('header');

        const clearTimer = () => {
          if (pressTimer != null) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        };

        const onStart = (ev: MouseEvent | TouchEvent) => {
          const target = ev.target as HTMLElement | null;
          if (!isHeader(target)) return;

          clearTimer();
          pressTimer = window.setTimeout(async () => {
            const headerEl = target!;
            const currentName = headerEl.textContent?.trim() || 'Grocery List';
            const newName = await new Promise<string | undefined>((resolve) => {
              const original = headerEl.textContent || '';
              headerEl.textContent = '';

              const input = document.createElement('input');
              input.type = 'text';
              input.value = currentName;
              input.className = 'input';
              input.style.width = '100%';
              input.style.font = 'inherit';
              input.style.padding = '6px 10px';
              input.style.boxSizing = 'border-box';

              let resolved = false;
              function finish(val?: string) {
                if (resolved) return;
                resolved = true;
                input.removeEventListener('keydown', onKeyDown as any);
                input.removeEventListener('blur', onBlur as any);
                headerEl.textContent = original;
                resolve(val);
              }
              function onKeyDown(e: any) {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  finish(input.value.trim());
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  finish(undefined);
                }
              }
              function onBlur() {
                finish(input.value.trim());
              }

              input.addEventListener('keydown', onKeyDown as any);
              input.addEventListener('blur', onBlur as any);

              headerEl.appendChild(input);
              setTimeout(() => {
                input.focus();
                input.select();
              }, 0);
            });
            if (!newName || newName === currentName) return;

            // Optimistically update UI
            headerEl.textContent = newName;

            // Try to persist by inferring the id from the URL
            try {
              const idFromUrl = window.location.pathname.split('/').pop();
              if (idFromUrl) {
                await fetch(`/api/lists/${idFromUrl}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newName }),
                }).catch(() => {});
              }
            } catch {
              // swallow
            }
          }, 550); // long-press threshold
        };

        document.addEventListener('mousedown', onStart, { passive: true });
        document.addEventListener('touchstart', onStart, { passive: true });
        ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((t) =>
          document.addEventListener(t, clearTimer as any, { passive: true })
        );
      }

      let name = 'Grocery List';

      create.mutate(name, {
        onSuccess: (l) => {
          setCookie(LIST_COOKIE, l.id);
          show('New list created');
          navigate(`/lists/${l.id}`, { replace: true });
        },
        onError: () => {
          creatingRef.current = false;
        },
      });
    }
  }, [error, create, navigate, show]);

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
              <input
                className="checkbox"
                type="checkbox"
                checked={i.status === 'completed'}
                onChange={() => toggle.mutate({ itemId: i.id })}
              />
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
