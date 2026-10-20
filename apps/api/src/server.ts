import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`GCC Web API berjalan di http://localhost:${env.PORT}/api`);
  logger.info(`CORS origin: ${env.WEB_ORIGIN} · WhatsApp: ${env.WHATSAPP_PROVIDER}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} diterima, menutup server…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  void shutdown('uncaughtException');
});
