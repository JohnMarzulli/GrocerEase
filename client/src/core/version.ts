import versionMeta from '@/meta/version.json';

// Utilities for building app version and copyright

export function pad(num: number | string, size = 2) {
    const s = String(num);
    return s.padStart(size, '0');
}

export function formatVersion(date?: Date, buildOfDay?: number | string) {
    const d = date ?? new Date();
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const build = buildOfDay !== undefined && buildOfDay !== null ? pad(Number(buildOfDay)) : '01';
    return `${yyyy}.${mm}.${dd}.${build}`;
}

export function getVersion() {
    // Prefer static config file when provided
    try {
        if ((versionMeta as any)?.version) return (versionMeta as any).version;
    } catch (e) {
        // ignore
    }

    // Prefer build values injected at build time via Vite (VITE_...)
    const env: any = (import.meta as any).env ?? {};
    const envDate = env.VITE_BUILD_DATE; // e.g. '2025-01-31T12:00:00Z'
    const envBuild = env.VITE_BUILD_OF_DAY ?? env.VITE_BUILD_NUMBER;

    const date = envDate ? new Date(envDate) : new Date();

    return formatVersion(date, envBuild);
}

export function getCopyright(startYear?: number, owner?: string) {
    const cfgStartYear = (versionMeta as any)?.startYear ?? startYear ?? 2025;
    const cfgOwner = (versionMeta as any)?.owner ?? owner ?? 'John Marzulli';
    const now = new Date();
    const currentYear = now.getFullYear();

    if (currentYear <= cfgStartYear) {
        return `Copyright ${cfgOwner} ${cfgStartYear}`;
    }

    return `Copyright ${cfgOwner} ${cfgStartYear}-${currentYear}`;
}
