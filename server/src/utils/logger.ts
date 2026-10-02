import util from 'util';

type LogLevel = 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

/** JSON lines in production (easy to search in Render logs), readable text otherwise. */
const format = (level: LogLevel, message: string, meta: LogMeta): string => {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta });
  }
  const metaString = Object.keys(meta).length ? ' ' + util.inspect(meta, { depth: 4, colors: true }) : '';
  return `${new Date().toISOString()} [${level.toUpperCase()}] ${message}${metaString}`;
};

const normalize = (meta: unknown): LogMeta => {
  if (meta instanceof Error) return { error: meta.message, stack: meta.stack };
  return (meta as LogMeta) ?? {};
};

export const logger = {
  info: (message: string, meta?: LogMeta) => console.log(format('info', message, normalize(meta))),
  warn: (message: string, meta?: LogMeta) => console.warn(format('warn', message, normalize(meta))),
  error: (message: string, meta?: unknown) => console.error(format('error', message, normalize(meta))),
};

export default logger;
