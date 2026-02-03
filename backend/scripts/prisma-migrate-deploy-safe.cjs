const { execSync } = require('node:child_process');

process.env.CHECKPOINT_DISABLE = process.env.CHECKPOINT_DISABLE || '1';
process.env.PRISMA_HIDE_UPDATE_MESSAGE = process.env.PRISMA_HIDE_UPDATE_MESSAGE || '1';

execSync('npx prisma migrate deploy --schema prisma/schema.prisma', { stdio: 'inherit' });

