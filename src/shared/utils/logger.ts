export function createLogger() {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
        error: error?.message,
        stack: error?.stack,
        ...meta,
      });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
      }
    },
  };
}

export const logger = createLogger();
