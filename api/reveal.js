import { updateDb, normalizeCode } from './_db.js';

const STICKERS = [
  {id:1,  name:'Brasil',    country:'Brasil 🇧🇷',    pos:'Seleção',      rarity:'comum',    emoji:'🇧🇷', bg:'linear-gradient(160deg,#009c3b,#ffdf00,#009c3b)', slot:'sel'},
  {id:2,  name:'Argentina', country:'Argentina 🇦🇷', pos:'Seleção',      rarity:'comum',    emoji:'🇦🇷', bg:'linear-gradient(160deg,#74acdf,#fff,#74acdf)',    slot:'sel'},
  {id:3,  name:'França',    country:'França 🇫🇷',    pos:'Seleção',      rarity:'comum',    emoji:'🇫🇷', bg:'linear-gradient(160deg,#002395,#fff,#ED2939)',    slot:'sel'},
  {id:4,  name:'Portugal',  country:'Portugal 🇵🇹',  pos:'Seleção',      rarity:'comum',    emoji:'🇵🇹', bg:'linear-gradient(160deg,#006600,#ff0000)',         slot:'sel'},
  {id:5,  name:'Alemanha',  country:'Alemanha 🇩🇪',  pos:'Seleção',      rarity:'comum',    emoji:'🇩🇪', bg:'linear-gradient(160deg,#000,#D00,#FFCE00)',       slot:'sel'},
  {id:6,  name:'Espanha',   country:'Espanha 🇪🇸',   pos:'Seleção',      rarity:'comum',    emoji:'🇪🇸', bg:'linear-gradient(160deg,#AA151B,#F1BF00,#AA151B)', slot:'sel'},
  {id:7,  name:'Bélgica',   country:'Bélgica 🇧🇪',   pos:'Seleção',      rarity:'comum',    emoji:'🇧🇪', bg:'linear-gradient(160deg,#000,#F00,#FDDA25)',       slot:'sel'},
  {id:8,  name:'Inglaterra',country:'Inglaterra 🏴', pos:'Seleção',      rarity:'comum',    emoji:'🏴', bg:'linear-gradient(160deg,#fff,#CF142B)',            slot:'sel'},
  {id:9,  name:'Holanda',   country:'Holanda 🇳🇱',   pos:'Seleção',      rarity:'comum',    emoji:'🇳🇱', bg:'linear-gradient(160deg,#AE1C28,#fff,#21468B)',    slot:'sel'},
  {id:10, name:'Uruguai',   country:'Uruguai 🇺🇾',   pos:'Seleção',      rarity:'comum',    emoji:'🇺🇾', bg:'linear-gradient(160deg,#5EB6E4,#fff)',            slot:'sel'},
  {id:11, name:'Itália',    country:'Itália 🇮🇹',    pos:'Seleção',      rarity:'comum',    emoji:'🇮🇹', bg:'linear-gradient(160deg,#009246,#fff,#CE2B37)',    slot:'sel'},
  {id:12, name:'Japão',     country:'Japão 🇯🇵',     pos:'Seleção',      rarity:'comum',    emoji:'🇯🇵', bg:'linear-gradient(160deg,#fff,#BC002D)',            slot:'sel'},
  {id:13, name:'Taça do Mundo', country:'⭐ ULTRA RARA', pos:'Figurinha Rara', rarity:'especial', emoji:'🏆', bg:'linear-gradient(160deg,#b8860b,#FFD700,#ffe066,#b8860b)', slot:'rara'}
];

function chooseSticker(revealed) {
  const revealedIds = [...new Set((revealed || []).map(r => r.stickerId))];
  const avail = STICKERS.filter(s => !revealedIds.includes(s.id));
  const pool = avail.length ? avail : STICKERS;

  const ultra = pool.find(s => s.rarity === 'especial');
  if (ultra && Math.random() < 0.08) return ultra;

  const comuns = pool.filter(s => s.rarity !== 'especial');
  return comuns.length ? comuns[Math.floor(Math.random() * comuns.length)] : pool[0];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  const code = normalizeCode(req.body?.code);

  const result = await updateDb(async (db) => {
    if (!code) {
      return { ...db, _response: { ok: false, status: 400, message: '⚠️ Digite o código da sua garrafa!' } };
    }

    if (!db.codes.includes(code)) {
      return { ...db, _response: { ok: false, status: 400, message: '❌ Código inválido. Confira e tente de novo!' } };
    }

    if ((db.usedCodes || []).some(item => item.code === code)) {
      return { ...db, _response: { ok: false, status: 400, message: '⚠️ Esse código já foi utilizado!' } };
    }

    const sticker = chooseSticker(db.revealed || []);

    const usedEntry = { code, usedAt: new Date().toISOString() };
    const revealedEntry = {
      code,
      stickerId: sticker.id,
      stickerName: sticker.name,
      rarity: sticker.rarity,
      country: sticker.country,
      emoji: sticker.emoji,
      revealedAt: new Date().toISOString()
    };

    const next = {
      ...db,
      usedCodes: [...(db.usedCodes || []), usedEntry],
      revealed: [...(db.revealed || []), revealedEntry]
    };

    next._response = {
      ok: true,
      status: 200,
      sticker,
      album: [...new Set(next.revealed.map(item => item.stickerId))]
    };

    return next;
  });

  const payload = result._response;
  delete result._response;

  return res.status(payload.status).json(payload);
}
