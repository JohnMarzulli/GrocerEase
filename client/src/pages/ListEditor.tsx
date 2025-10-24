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
  const toggle = useToggleItem(id ?? '');
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
