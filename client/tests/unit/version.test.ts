import { describe, expect, it } from 'vitest';
import { formatVersion, getCopyright, getVersion } from '../../src/core/version';
import versionMeta from '../../src/meta/version.json';

describe('version util', () => {
    it('formats a predictable version', () => {
        const dt = new Date('2025-01-31T12:00:00Z');
        const v = formatVersion(dt, 2);
        expect(v).toBe('2025.01.31.02');
    });

    it('returns the version from config when present', () => {
        const v = getVersion();
        expect(v).toBe((versionMeta as any).version);
    });

    it('returns the expected copyright range from config', () => {
        const out = getCopyright();
        const startYear = (versionMeta as any).startYear;
        const currentYear = new Date().getFullYear();
        expect(out).toContain(String(startYear));
        expect(out).toContain(String(currentYear));
        expect(out).toContain((versionMeta as any).owner);
    });
});
