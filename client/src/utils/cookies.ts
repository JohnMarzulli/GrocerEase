const defaultDays = 365;

export function setCookie(name: string, value: string, days = defaultDays) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; samesite=lax`;
}

export function getCookie(name: string): string | null {
  const key = encodeURIComponent(name) + '=';
  const parts = document.cookie.split(';');
  for (let c of parts) {
    c = c.trim();
    if (c.startsWith(key)) {
      return decodeURIComponent(c.substring(key.length));
    }
  }
  return null;
}

export const LIST_COOKIE = 'ge_list_id';
