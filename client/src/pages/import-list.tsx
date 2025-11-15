import { GroceryList } from '@/core/grocery-list';
import { getListFromData, groceryListManager } from '@/core/grocery-list-manager';
import { useToast } from '@/state/toast';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function ImportListPage() {
    const { search } = useLocation();
    const nav = useNavigate();
    const { show } = useToast();

    useEffect(() => {
        const qs = new URLSearchParams(search);
        const data = qs.get('data');

        if (!data) {
            show('Missing data in query params');
            return;
        }

        try {
            // Normalize: override id and ensure createdAt
            const list: GroceryList | null = getListFromData(data);

            if (!list) {
                show('Failed to import list.');

                return;
            }

            try {
                const finalList: GroceryList = groceryListManager.importList(list);

                show(`Imported "${finalList.getListName()}"`);

                nav(`/shopping?id=${encodeURIComponent(finalList.getListId())}`);
            } catch (e) {
                console.error(e);
                show('Failed to save imported list');
            }
        } catch (e) {
            console.error(e);
            show(`Failed to decode import data: ${e}`);
        }
    }, [search, nav, show]);

    return (
        <div className="mobile-shell" style={{ padding: 24 }}>
            <h2>Importing list…</h2>
            <p>If the import succeeds you will be redirected to the shopping view.</p>
            <div className="footer">
                <div className="footer-bar">
                    <Link className="interactive-btn" to="/" style={{ width: '25%', textAlign: 'center', alignContent: 'center', marginRight: 2 }}>Home</Link>
                </div>
            </div>
        </div>
    );
}
