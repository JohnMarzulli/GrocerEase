import { encodeBase64Url } from '@/core/encoding';
import { getValidListIdFromQueryParams, groceryListManager } from '@/core/gocery-list-manager';
import { useToast } from '@/state/toast';
import { useLocation } from 'react-router-dom';

export default function ShareButton() {
    const loc = useLocation();
    const listIdFromQs = getValidListIdFromQueryParams();
    const { show } = useToast();

    const onClick = async () => {
        try {
            const list = groceryListManager.getList(listIdFromQs).getList();
            const json = JSON.stringify(list);
            const encoded = encodeBase64Url(json);
            const link = `${location.origin}/import?id=${encodeURIComponent(list.id)}&data=${encodeURIComponent(encoded)}`;

            await navigator.clipboard.writeText(link);

            show('Link Copied', { durationMs: 2500, style: { background: '#00a884', color: '#17344f' } });
        } catch (e) {
            console.error(e);
            show('Failed to copy link');
        }
    };

    return (
        <button aria-label="Share list" title="Share list" className="interactive-btn share-btn" onClick={onClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="9" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="#17344f" />
                <rect x="3" y="7" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="#17344f" />
            </svg>
        </button>
    );
}
