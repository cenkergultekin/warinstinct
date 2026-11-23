import { list, put } from '@vercel/blob';

export const USERS = {
  onur: { partner: 'cenker' },
  cenker: { partner: 'onur' }
};

export function isValidUser(u) {
  return u === 'onur' || u === 'cenker';
}

export function getIstanbulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function shiftDateKey(baseKey, offsetDays) {
  const [y, m, d] = baseKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function diffDays(startKey, endKey) {
  const [y1, m1, d1] = startKey.split('-').map(Number);
  const [y2, m2, d2] = endKey.split('-').map(Number);
  return Math.floor((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export async function readUserManifest(user) {
  const prefix = `meta/${user}.json`;
  const { blobs } = await list({ prefix, limit: 5 });
  const exact = blobs.find((b) => b.pathname === prefix);
  if (!exact) {
    return { firstDate: null, days: {} };
  }
  const res = await fetch(`${exact.url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return { firstDate: null, days: {} };
  const data = await res.json();
  return {
    firstDate: data.firstDate || null,
    days: data.days || {}
  };
}

export async function writeUserManifest(user, manifest) {
  await put(`meta/${user}.json`, JSON.stringify(manifest), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export function computeSeventhDayWindow(manifest, todayKey) {
  const keys = Object.keys(manifest.days || {}).sort();
  const firstKey = manifest.firstDate || keys[0];
  if (!firstKey) return null;

  const elapsed = diffDays(firstKey, todayKey);
  // Active ONLY on exact 7th, 14th, 21st... day (24h window in Europe/Istanbul)
  if (elapsed < 6 || (elapsed + 1) % 7 !== 0) return null;

  const periodIndex = Math.floor(elapsed / 7) + 1;
  const startKey = shiftDateKey(todayKey, -6);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dateKey = shiftDateKey(startKey, i);
    days.push({
      dayIndex: i + 1,
      dateKey,
      drop: manifest.days[dateKey] || null
    });
  }
  return { index: periodIndex, startKey, endKey: todayKey, days };
}
