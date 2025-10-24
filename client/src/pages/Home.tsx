import { useNavigate } from 'react-router-dom';
import { useCreateList, useLists } from '@/services/hooks';
import { useCallback } from 'react';
import { getCookie, setCookie, LIST_COOKIE } from '@/utils/cookies';

export default function Home() {
  const { data: lists } = useLists();
  const create = useCreateList();
  const navigate = useNavigate();

  const goToList = useCallback(() => {
    const fromCookie = getCookie(LIST_COOKIE);
    if (fromCookie) {
      navigate('/list');
      return;
    }
    const first = lists?.[0];
    if (first) {
      setCookie(LIST_COOKIE, first.id);
      navigate('/list');
      return;
    }
    create.mutate('My List', {
      onSuccess: (l) => {
        setCookie(LIST_COOKIE, l.id);
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
