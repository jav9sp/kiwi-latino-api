import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { initSocket } from './lib/socket';
import { registerChatHandlers } from './sockets/chat.socket';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = initSocket(httpServer);
registerChatHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`🌿 Kiwi Latino API running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Socket.IO enabled`);
});
