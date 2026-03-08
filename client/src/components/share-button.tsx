import { compressData } from '@/core/encoding';
import { getValidListIdFromQueryParams, groceryListManager } from '@/core/grocery-list-manager';
import { isServerListId } from '@/core/server-lists';
import { useToast } from '@/state/toast';

export default function ShareButton() {
    const listIdFromQs = getValidListIdFromQueryParams();
    const { show } = useToast();

    const onClick = async () => {
        try {
            let link: string;

            if (isServerListId(listIdFromQs)) {
                // Cloud list: share by reference so recipients open the live cloud copy
                link = `${location.origin}/edit?id=${listIdFromQs}`;
            } else {
                // Local list: embed the full content so the link is self-contained
                const list = groceryListManager.getList(listIdFromQs).getList();
                const json = JSON.stringify(list);
                const compressed = await compressData(json);
                link = `${location.origin}/import?data=${encodeURIComponent(compressed)}`;
            }

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
