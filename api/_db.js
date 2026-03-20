import fs from 'fs';

const DB_FILE = '/tmp/runtime-db.js';

function defaultData() {
  return {
    admin: {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || '123456'
    },
    codes: [
      'LOLY001','LOLY002','LOLY003','LOLY004','LOLY005',
      'LOLY006','LOLY007','LOLY008','LOLY009','LOLY010',
      'COPA001','COPA002','COPA003','COPA004','COPA005',
      'ACAI001','ACAI002','ACAI003','ACAI004','ACAI005',
      'GARRA01','GARRA02','GARRA03','GARRA04','GARRA05'
    ],
    usedCodes: [],
    revealed: []
  };
}

function serialize(data) {
  return 'module.exports = ' + JSON.stringify(data, null, 2) + ';\n';
}

export function ensureDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, serialize(defaultData()), 'utf8');
  }
}

export async function readDb() {
  ensureDb();

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const match = raw.match(/module\.exports\s*=\s*([\s\S]*);?\s*$/);

    if (!match) return defaultData();

    const parsed = JSON.parse(match[1]);

    return {
      admin: parsed.admin || defaultData().admin,
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
      usedCodes: Array.isArray(parsed.usedCodes) ? parsed.usedCodes : [],
      revealed: Array.isArray(parsed.revealed) ? parsed.revealed : []
    };
  } catch {
    return defaultData();
  }
}

export async function writeDb(data) {
  fs.writeFileSync(DB_FILE, serialize(data), 'utf8');
  return data;
}

export async function updateDb(mutator) {
  const current = await readDb();
  const next = await mutator(current);
  await writeDb(next);
  return next;
}

export function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}
