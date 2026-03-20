import { readDb, updateDb, normalizeCode } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const db = await readDb();
    return res.status(200).json({
      ok: true,
      codes: db.codes.map(code => ({
        code,
        used: db.usedCodes.some(item => item.code === code)
      }))
    });
  }

  if (req.method === 'POST') {
    const { action, oldCode, newCode } = req.body || {};

    const result = await updateDb(async (db) => {
      const currentOld = normalizeCode(oldCode);
      const currentNew = normalizeCode(newCode);

      if (action === 'add') {
        if (!currentNew) {
          return { ...db, _response: { ok: false, status: 400, message: 'Digite um código válido.' } };
        }
        if (db.codes.includes(currentNew)) {
          return { ...db, _response: { ok: false, status: 400, message: 'Esse código já existe.' } };
        }
        return {
          ...db,
          codes: [...db.codes, currentNew],
          _response: { ok: true, status: 200, message: 'Código adicionado com sucesso.' }
        };
      }

      if (action === 'edit') {
        if (!currentOld || !currentNew) {
          return { ...db, _response: { ok: false, status: 400, message: 'Dados inválidos.' } };
        }
        const idx = db.codes.indexOf(currentOld);
        if (idx === -1) {
          return { ...db, _response: { ok: false, status: 404, message: 'Código não encontrado.' } };
        }
        if (db.usedCodes.some(item => item.code === currentOld)) {
          return { ...db, _response: { ok: false, status: 400, message: 'Não é possível editar um código já usado.' } };
        }
        if (db.codes.includes(currentNew) && currentNew !== currentOld) {
          return { ...db, _response: { ok: false, status: 400, message: 'O novo código já existe.' } };
        }
        const updatedCodes = [...db.codes];
        updatedCodes[idx] = currentNew;
        return {
          ...db,
          codes: updatedCodes,
          _response: { ok: true, status: 200, message: 'Código editado com sucesso.' }
        };
      }

      if (action === 'delete') {
        if (!currentOld) {
          return { ...db, _response: { ok: false, status: 400, message: 'Código inválido.' } };
        }
        if (!db.codes.includes(currentOld)) {
          return { ...db, _response: { ok: false, status: 404, message: 'Código não encontrado.' } };
        }
        if (db.usedCodes.some(item => item.code === currentOld)) {
          return { ...db, _response: { ok: false, status: 400, message: 'Não é possível excluir um código já usado.' } };
        }
        return {
          ...db,
          codes: db.codes.filter(code => code !== currentOld),
          _response: { ok: true, status: 200, message: 'Código excluído com sucesso.' }
        };
      }

      return { ...db, _response: { ok: false, status: 400, message: 'Ação inválida.' } };
    });

    const payload = result._response;
    delete result._response;

    return res.status(payload.status).json(payload);
  }

  return res.status(405).json({ ok: false, message: 'Método não permitido' });
}
