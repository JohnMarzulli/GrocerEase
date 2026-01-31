import { getCopyright, getVersion } from '@/core/version';

export default function Version() {
    const version = getVersion();
    const copyright = getCopyright();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="version-text" style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{version}</div>
            <div className="copyright-text" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{copyright}</div>
        </div>
    );
}
