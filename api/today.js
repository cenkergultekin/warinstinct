import {
  USERS,
  isValidUser,
  getIstanbulDateKey,
  readUserManifest,
  computeSeventhDayWindow
} from './_blob.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = String(req.query.user || '').toLowerCase();
  if (!isValidUser(user)) {
    return res.status(400).json({ error: 'Invalid user' });
  }

  try {
    const today = getIstanbulDateKey();
    const partner = USERS[user].partner;

    const [ownManifest, partnerManifest] = await Promise.all([
      readUserManifest(user),
      readUserManifest(partner)
    ]);

    return res.status(200).json({
      today,
      ownDrop: ownManifest.days[today] || null,
      partnerDrop: partnerManifest.days[today] || null,
      seventhDay: computeSeventhDayWindow(ownManifest, today)
    });
  } catch (err) {
    console.error('GET /api/today error:', err);
    return res.status(500).json({ error: 'Storage read failed' });
  }
}
