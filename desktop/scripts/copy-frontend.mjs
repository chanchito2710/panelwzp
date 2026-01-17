import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(here, '..');
const src = path.resolve(desktopRoot, '..', 'frontend', 'dist');
const dst = path.resolve(desktopRoot, 'renderer');

const rm = async (p) => {
  try { await fs.rm(p, { recursive: true, force: true }); } catch {}
};

const copyDir = async (from, to) => {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const ent of entries) {
    const a = path.join(from, ent.name);
    const b = path.join(to, ent.name);
    if (ent.isDirectory()) await copyDir(a, b);
    else if (ent.isFile()) await fs.copyFile(a, b);
  }
};

await rm(dst);
await copyDir(src, dst);
