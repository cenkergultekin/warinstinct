import { put } from '@vercel/blob';
import {
  isValidUser,
  getIstanbulDateKey,
  readUserManifest,
  writeUserManifest
} from './_blob.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '3mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user: rawUser, imageBase64, note: rawNote } = req.body || {};
    const user = String(rawUser || '').toLowerCase();
    const note = String(rawNote || '').trim().slice(0, 120);

    if (!isValidUser(user)) {
      return res.status(400).json({ error: 'Invalid user' });
    }
    if (!note) {
      return res.status(400).json({ error: 'Note is required' });
    }
    if (typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/webp;base64,')) {
      return res.status(400).json({ error: 'WebP image required' });
    }

    const base64Body = imageBase64.slice('data:image/webp;base64,'.length);
    const buffer = Buffer.from(base64Body, 'base64');
    if (buffer.byteLength > 2.5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 2.5MB)' });
    }

    const today = getIstanbulDateKey();
    const blob = await put(`drops/${user}/${today}.webp`, buffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      allowOverwrite: true
    });

    const manifest = await readUserManifest(user);
    if (!manifest.firstDate) {
      manifest.firstDate = today;
    }
    const drop = {
      img: `${blob.url}?v=${Date.now()}`,
      note,
      createdAt: Date.now()
    };
    manifest.days[today] = drop;
    await writeUserManifest(user, manifest);

    return res.status(200).json({ ok: true, today, drop });
  } catch (err) {
    console.error('POST /api/drop error:', err);
    return res.status(500).json({ error: 'Storage write failed' });
  }
}
