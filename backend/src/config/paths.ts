import path from 'path';

export const DB_ROOT = process.env.DB_ROOT
    ? path.resolve(process.env.DB_ROOT)
    : path.resolve(process.cwd(), '../db');

export const dbPath = (...segments: string[]) => path.join(DB_ROOT, ...segments);

