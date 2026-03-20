import { readDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  const { username, password } = req.body || {};
  const db = await readDb();

  const valid = username === db.admin.username && password === db.admin.password;

  if (!valid) {
    return res.status(401).json({ ok: false, message: 'Usuário ou senha inválidos' });
  }

  return res.status(200).json({ ok: true, message: 'Login realizado com sucesso' });
}
