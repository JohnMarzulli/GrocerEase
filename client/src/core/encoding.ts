import { gunzipSync } from 'fflate';

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
    const decoded = atob(s);

    return JSON.parse(decoded) as T;
}

export function encodeBase64Url(str: string) {
    // unicode-safe base64
    const b64 = btoa(unescape(encodeURIComponent(str)));

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
    const base64String = btoa(String.fromCharCode(...uint8Array));

    return base64String;
}


export function decompressData(
    compressedBase64: string
): string {
    // normalize URL-safe base64 and pad
    let s = compressedBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';

    // Convert base64 to Uint8Array
    const binaryString = atob(s);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
    }

    // Synchronous gunzip
    const decompressed = gunzipSync(byteArray);

    // Decode to string
    return new TextDecoder().decode(decompressed);
}


// EXAMPLES:
//
// URL with uncompressed, encoded data: http://localhost:5173/import?data=eyJpZCI6IjdlNTVlMTgyLTNhYzItNDJiMS1hODY2LWI1ZTA1MjQxMTc5ZSIsIm5hbWUiOiJDaGVmIFN0b3JlIiwiY3JlYXRlZEF0IjoiMjAyNS0xMC0zMFQyMToyNDowNC44NDhaIiwiaXRlbXMiOlt7ImlkIjoiODU2MDVhNGUtMDc4Mi00ZWYyLWIzNzMtYjE1MzM2Y2NkMDU4IiwibmFtZSI6IkxpbW9uYXRhIiwicXR5IjoxLCJ1bml0IjoiZWEiLCJzdGF0dXMiOiJwZW5kaW5nIiwib3JkZXIiOjB9LHsiaWQiOiI4ZTk0ODc0Ni0xMWEwLTQzNWYtOWZiMS0zYzU1MDY3YWQ3M2IiLCJuYW1lIjoiTnV0ZWxsYSIsInF0eSI6MSwidW5pdCI6ImVhIiwic3RhdHVzIjoicGVuZGluZyIsIm9yZGVyIjoxfSx7ImlkIjoiYjYzZjc2ZGUtMWJhMy00ZWQxLTk2OWQtM2JiMDBkNDc2YmJkIiwibmFtZSI6IkNhc2UiLCJxdHkiOjEsInVuaXQiOiJlYSIsInN0YXR1cyI6InBlbmRpbmciLCJvcmRlciI6Mn1dfQ
// URL with compressed, encoded data: http://localhost:5173/import?data=H4sIAAAAAAAACpXQPUvEQBCA4b8iU2dkZr%2BzndiKjVaKxW52cgYuiSabQo777xJEz%2Fbat3ngPcFQIIIXa4WDQp06hUZlxhScw2yFrDLMvhVoYEqjQIT7d%2Blvnuq87K1bJFUpdxUiKFIWmVDTs%2BKoTCRzG0x4gQaGKuMK8fX0AwbryCYjSD4oNNIrzNprzGy1dl1XyIYL%2BDCM85RqggY%2B6xdEbmCbhl2Uva011W2FCB8ylWE6QAPzUmSBSOfmF5TWBG8cMidCo22PbZ8ZdWctOZ%2BK1%2FkCPm5VjsfrPf7zstO9d0WQc9JopDC2ri2ocyYqxrucy7%2BjaZWrMXV%2BO38DYtLtd8ABAAA%3D
