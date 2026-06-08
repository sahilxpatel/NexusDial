import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (data: { token: string }) => {
      try {
        if (!data || !data.token) {
          socket.emit('error', { message: 'No token provided' });
          return;
        }
        
        const decoded = jwt.verify(data.token, config.jwtSecret) as { tenantId: string };
        socket.join(decoded.tenantId);
        logger.info(`Socket ${socket.id} joined room ${decoded.tenantId}`);
        socket.emit('joined', { tenantId: decoded.tenantId });
      } catch (error) {
        logger.error('Socket join auth error', error);
        socket.emit('error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
