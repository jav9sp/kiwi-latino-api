import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { initSocket } from './lib/socket';
import { registerChatHandlers } from './sockets/chat.socket';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

function maskDbUrl(url: string | undefined): string {
  if (!url) return '(not set)';
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

const httpServer = createServer(app);
const io = initSocket(httpServer);
registerChatHandlers(io);

httpServer.listen(PORT, () => {
  if (IS_PROD) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 BELFERA API — PRODUCTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('┌─────────────────────────────────────┐');
    console.log('│  🛠️  BELFERA API — DEVELOPMENT       │');
    console.log('└─────────────────────────────────────┘');
    console.log(`  ⚠️  Conectado a DB LOCAL — NO es producción`);
  }
  console.log(`  Port    : ${PORT}`);
  console.log(`  Env     : ${NODE_ENV}`);
  console.log(`  DB      : ${maskDbUrl(process.env.DATABASE_URL)}`);
  console.log(`  Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`  Socket  : enabled`);
  if (!IS_PROD) console.log('');
});
