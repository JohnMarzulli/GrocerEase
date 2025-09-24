import { useParams, Link } from 'react-router-dom';
import { useAddItem, useList, useToggleItem } from '@/services/hooks';
import { FormEvent, useState } from 'react';

export default function ListEditor() {
  const params = useParams();
  const id = params.id!;
  const { data: list, isLoading } = useList(id);
  const addItem = useAddItem(id);
  const toggle = useToggleItem(id);
  const [text, setText] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = text.trim();
    if (!name) return;
    addItem.mutate({ name }, { onSuccess: () => setText('') });
  };

  if (isLoading || !list) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/">← Back</Link>
      <h1>{list.name}</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add item"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={addItem.isPending}>
          {addItem.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

      <h2 style={{ marginTop: 24 }}>Items</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {list.items.map((i) => (
          <li key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <input
              type="checkbox"
              checked={i.status === 'completed'}
              onChange={() => toggle.mutate({ itemId: i.id })}
            />
            <span style={{ textDecoration: i.status === 'completed' ? 'line-through' : 'none' }}>{i.name}</span>
            <span style={{ marginLeft: 'auto', color: '#666' }}>{i.qty} {i.unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
