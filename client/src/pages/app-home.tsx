import { getListCookie, saveListCookie } from '@/core/list-manager';
import { useCreateList, useLists } from '@/services/hooks';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


export default function Home() {
  const { data: lists } = useLists();
  const create = useCreateList();
  const navigate = useNavigate();

  const goToList = useCallback(() => {
    const fromCookie = getListCookie();
    if (fromCookie) {
      navigate('/list');
      return;
    }
    const first = lists?.[0];
    if (first) {
      saveListCookie(first.id);
      navigate('/list');
      return;
    }
    create.mutate('My List', {
      onSuccess: (l) => {
        saveListCookie(l.id);
        navigate('/list');
      },
    });
  }, [lists, create, navigate]);

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: '3rem' }}>GrocerEase</header>
      <main className="content">
        <section className="grid2" style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', marginTop: '25vh' }}>
          <button className="tile" style={{ width: '50%' }} onClick={() => { /* future: shopping flow */ }}>Shop</button><br/>
          <button className="tile" style={{ width: '50%' }} onClick={goToList}>List</button>
        </section>
      </main>
    </div>
  );
}
