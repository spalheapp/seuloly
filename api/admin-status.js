import { readDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  const db = await readDb();

  return res.status(200).json({
    ok: true,
    totalCodes: db.codes.length,
    usedCount: db.usedCodes.length,
    revealedCount: db.revealed.length
  });
}
