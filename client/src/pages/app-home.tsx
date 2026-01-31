import Version from '@/components/version';
import { useCreateList, useLists } from '@/services/hooks';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * The home page handler.
 * @returns the HTML to render.
 */
export default function Home() {
  const { data: lists } = useLists();
  const create = useCreateList();
  const navigate = useNavigate();

  const goToList = useCallback(() => {
    navigate(`/lists`);
  }, [lists, create, navigate]);

  return (
    <div className="mobile-shell">
      <header className="header" style={{ textAlign: 'center', fontSize: '3rem' }}>GrocerEase</header>
      <main className="content">
        <section className="grid2" style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', marginTop: '25vh' }}>
          <button className="tile" style={{ width: '50%' }} onClick={() => navigate('/shopping-selector')}>Shop</button><br />
          <button className="tile" style={{ width: '50%' }} onClick={goToList}>Edit</button>
        </section>
        <div className="footer">
          <div className="footer-bar">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Version />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
