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