import { readDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  const db = await readDb();
  const album = [...new Set((db.revealed || []).map(item => item.stickerId))];

  return res.status(200).json({
    ok: true,
    album
  });
}
