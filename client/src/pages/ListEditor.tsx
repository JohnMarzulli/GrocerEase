import { Link } from 'react-router-dom';
import { useAddItem, useList, useCreateList, useIncrementItem, useDecrementItem, useRenameList } from '@/services/hooks';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { getCookie, setCookie, LIST_COOKIE } from '@/utils/cookies';
import { useToast } from '@/state/toast';

export default function ListEditor() {
  const [id, setId] = useState<string | undefined>(() => getCookie(LIST_COOKIE) || undefined);
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
            {list.name}
            <div style={{ marginTop: 8 }}>
              <button className="home-btn" onClick={() => { setNameInput(list.name); setEditingName(true); }}>Rename</button>
            </div>
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

        <ul className="list">
          {list.items.map((i) => (
            <li key={i.id}>
              <span style={{ textDecoration: i.status === 'completed' ? 'line-through' : 'none' }}>{i.name}</span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <span className="badge">{i.qty} {i.unit}</span>
                <button className="home-btn" type="button" onClick={() => dec.mutate({ itemId: i.id })}>-</button>
                <button className="home-btn" type="button" onClick={() => inc.mutate({ itemId: i.id })}>+</button>
              </div>
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
