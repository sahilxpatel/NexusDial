import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { config } from './config/env';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});

export { httpServer, io };
