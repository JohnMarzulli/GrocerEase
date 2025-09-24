import { Link } from 'react-router-dom';
import { useCreateList, useLists } from '@/services/hooks';
import { FormEvent, useState } from 'react';

export default function Home() {
  const { data: lists, isLoading } = useLists();
  const create = useCreateList();
  const [name, setName] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(name.trim(), { onSuccess: () => setName('') });
  };

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>GrocerEase</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create'}
        </button>
      </form>

      <h2 style={{ marginTop: 24 }}>Lists</h2>
      {isLoading && <p>Loading…</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {lists?.map((l) => (
          <li key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <Link to={`/lists/${l.id}`}>{l.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
