import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(here, '..');
const backendRoot = path.resolve(desktopRoot, '..', 'backend');
const dst = path.resolve(desktopRoot, 'node_modules', 'backend', 'dist');
const tscBin = path.resolve(backendRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const rm = async (p) => {
  try { await fs.rm(p, { recursive: true, force: true }); } catch {}
};

const run = (cmd, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`${cmd} exit code ${code}`));
  });
});

await rm(dst);
await fs.mkdir(dst, { recursive: true });

await run(
  process.execPath,
  [
    tscBin,
    '-p',
    path.resolve(backendRoot, 'tsconfig.json'),
    '--outDir',
    dst,
    '--rootDir',
    path.resolve(backendRoot, 'src')
  ],
  backendRoot
);
