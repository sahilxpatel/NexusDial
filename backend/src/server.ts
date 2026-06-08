import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { logger } from './utils/logger';
import { config } from './config/env';
import { setupSockets } from './sockets/index';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.set('io', io);
setupSockets(io);

httpServer.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});

export { httpServer, io };

import './workers/intelligence.worker';
