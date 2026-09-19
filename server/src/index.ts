import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { initRealtime } from './services/realtime';
import { ensureUploadDir } from './utils/fs';

console.log(`Node ${process.version} starting server...`);

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

ensureUploadDir();

const httpServer = createServer(app);

initRealtime(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  httpServer.close(() => process.exit(1));
});

export { httpServer };