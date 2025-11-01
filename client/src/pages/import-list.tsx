import * as encoding from '@/core/encoding';
import { isUuid } from '@/core/grocery-list-manager';
import { useToast } from '@/state/toast';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
            let parsed: any = {};

            if (data.startsWith('ey')) {
                parsed = encoding.decodeBase64ToJson<any>(data);
            } else {
                parsed = JSON.parse(encoding.decompressData(data));
            }

            const listId: string = parsed?.id;

            if (!listId || typeof listId !== 'string' || !isUuid(listId)) {
                show('Imported data is missing a valid list ID');

                return;
            }

            // Ensure parsed looks like a list
            if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
                show('Imported data is not a valid grocery list');

                return;
            }

            // Normalize: override id and ensure createdAt
            const list = {
                ...parsed,
                id: parsed.id,
                createdAt: parsed.createdAt ?? new Date().toISOString(),
                items: Array.isArray(parsed.items) ? parsed.items : [],
            };

            // Save to localStorage using the same key format as GroceryList
            try {
                localStorage.setItem(listId, JSON.stringify(list));
                show('List imported');
                // Navigate to shopping view with listId in query
                nav(`/shopping?id=${encodeURIComponent(listId)}`);
            } catch (e) {
                console.error(e);
                show('Failed to save imported list');
            }
        } catch (e) {
            console.error(e);
            show('Failed to decode import data');
        }
    }, [search, nav, show]);

    return (
        <div className="mobile-shell" style={{ padding: 24 }}>
            <h2>Importing list…</h2>
            <p>If the import succeeds you will be redirected to the shopping view.</p>
        </div>
    );
}
