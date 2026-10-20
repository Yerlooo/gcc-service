const stamp = () => new Date().toISOString();

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(`[${stamp()}] INFO  ${message}`, meta ?? '');
  },
  warn(message: string, meta?: unknown) {
    console.warn(`[${stamp()}] WARN  ${message}`, meta ?? '');
  },
  error(message: string, meta?: unknown) {
    console.error(`[${stamp()}] ERROR ${message}`, meta ?? '');
  },
};
