import { gunzipSync } from 'fflate';

// Cross-platform base64 helpers: use browser `atob`/`btoa` when available,
// otherwise fall back to Node's Buffer implementation so unit tests run under Node.
function getNodeBuffer(): any | undefined {
    // Prefer global Buffer if present
    if (typeof (globalThis as any).Buffer !== 'undefined') return (globalThis as any).Buffer;

    // Try to require the 'buffer' module (works in Node test runtimes)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('buffer');
        return mod?.Buffer;
    } catch {
        return undefined;
    }
}

function atobPoly(s: string): string {
    if (typeof (globalThis as any).atob === 'function') {
        return (globalThis as any).atob(s);
    }

    const nodeBuffer = getNodeBuffer();
    if (nodeBuffer && typeof nodeBuffer.from === 'function') {
        // decode to latin1/binary string so callers that expect char codes work
        return nodeBuffer.from(s, 'base64').toString('latin1');
    }

    throw new Error('No base64 decoder available in this environment');
}

function btoaPoly(str: string): string {
    if (typeof (globalThis as any).btoa === 'function') {
        return (globalThis as any).btoa(str);
    }

    const nodeBuffer = getNodeBuffer();
    if (nodeBuffer && typeof nodeBuffer.from === 'function') {
        // encode from latin1/binary string
        return nodeBuffer.from(str, 'latin1').toString('base64');
    }

    throw new Error('No base64 encoder available in this environment');
}

/**
 * Decodes a base64-encoded into a JSON object.
 * @param b64 The base 64 string to decode.
 * @returns A JSON object with the decoded data.
 */
export function decodeBase64ToJson<T = any>(
    b64: string
): T {
    // handle URL-safe base64
    let s = b64.replace(/-/g, '+').replace(/_/g, '/');
    // pad
    while (s.length % 4) s += '=';
    const decoded = atobPoly(s);

    return JSON.parse(decoded) as T;
}

export function encodeBase64Url(str: string) {
    // unicode-safe base64
    let b64: string;
    if (typeof (globalThis as any).btoa === 'function') {
        b64 = btoa(unescape(encodeURIComponent(str)));
    } else {
        const nodeBuffer = getNodeBuffer();
        if (nodeBuffer && typeof nodeBuffer.from === 'function') {
            // Node: use utf-8 directly
            b64 = nodeBuffer.from(str, 'utf-8').toString('base64');
        } else {
            // fallback to the binary-safe helper using the encodeURIComponent trick
            b64 = btoaPoly(unescape(encodeURIComponent(str)));
        }
    }

    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function compressData(
    str: string
): Promise<string> {
    const byteArray = new TextEncoder().encode(str);
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();

    const compressedBuffer: ArrayBuffer = await new Response(cs.readable).arrayBuffer();

    // Convert ArrayBuffer to base64 string
    const uint8Array = new Uint8Array(compressedBuffer);
    const binaryStr = String.fromCharCode(...uint8Array);
    const base64String = btoaPoly(binaryStr);

    return base64String;
}


export function decompressData(
    compressedBase64: string
): string {
    // Some import payloads may be URL-encoded (contain %2F etc).
    // Try to decode URL-encoded input first so atob receives a clean base64 string.
    let maybeDecoded = compressedBase64;
    try {
        // decodeURIComponent will be a no-op if there are no percent-escapes
        maybeDecoded = decodeURIComponent(compressedBase64);
    } catch {
        // leave as-is if decoding fails
        maybeDecoded = compressedBase64;
    }

    // normalize URL-safe base64 and pad
    let s = maybeDecoded.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';

    // Convert base64 to Uint8Array
    const binaryString = atobPoly(s);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
    }

    // Synchronous gunzip
    const decompressed = gunzipSync(byteArray);

    // Decode to string
    return new TextDecoder().decode(decompressed);
}

export function getJsonFromImportData(data: string): any {
    let parsed: any = {};

    if (data.startsWith('ey')) {
        parsed = decodeBase64ToJson<any>(data);
    } else {
        parsed = JSON.parse(decompressData(data));
    }

    return parsed;
}


// EXAMPLES:
//
// URL with uncompressed, encoded data: http://localhost:5173/import?data=eyJpZCI6IjdlNTVlMTgyLTNhYzItNDJiMS1hODY2LWI1ZTA1MjQxMTc5ZSIsIm5hbWUiOiJDaGVmIFN0b3JlIiwiY3JlYXRlZEF0IjoiMjAyNS0xMC0zMFQyMToyNDowNC44NDhaIiwiaXRlbXMiOlt7ImlkIjoiODU2MDVhNGUtMDc4Mi00ZWYyLWIzNzMtYjE1MzM2Y2NkMDU4IiwibmFtZSI6IkxpbW9uYXRhIiwicXR5IjoxLCJ1bml0IjoiZWEiLCJzdGF0dXMiOiJwZW5kaW5nIiwib3JkZXIiOjB9LHsiaWQiOiI4ZTk0ODc0Ni0xMWEwLTQzNWYtOWZiMS0zYzU1MDY3YWQ3M2IiLCJuYW1lIjoiTnV0ZWxsYSIsInF0eSI6MSwidW5pdCI6ImVhIiwic3RhdHVzIjoicGVuZGluZyIsIm9yZGVyIjoxfSx7ImlkIjoiYjYzZjc2ZGUtMWJhMy00ZWQxLTk2OWQtM2JiMDBkNDc2YmJkIiwibmFtZSI6IkNhc2UiLCJxdHkiOjEsInVuaXQiOiJlYSIsInN0YXR1cyI6InBlbmRpbmciLCJvcmRlciI6Mn1dfQ
// URL with compressed, encoded data: http://localhost:5173/import?data=H4sIAAAAAAAACpXQPUvEQBCA4b8iU2dkZr%2BzndiKjVaKxW52cgYuiSabQo777xJEz%2Fbat3ngPcFQIIIXa4WDQp06hUZlxhScw2yFrDLMvhVoYEqjQIT7d%2Blvnuq87K1bJFUpdxUiKFIWmVDTs%2BKoTCRzG0x4gQaGKuMK8fX0AwbryCYjSD4oNNIrzNprzGy1dl1XyIYL%2BDCM85RqggY%2B6xdEbmCbhl2Uva011W2FCB8ylWE6QAPzUmSBSOfmF5TWBG8cMidCo22PbZ8ZdWctOZ%2BK1%2FkCPm5VjsfrPf7zstO9d0WQc9JopDC2ri2ocyYqxrucy7%2BjaZWrMXV%2BO38DYtLtd8ABAAA%3D
