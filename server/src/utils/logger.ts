import util from 'util';

type LogLevel = 'info' | 'error';

interface LogMeta {
  [key: string]: any;
}

const format = (level: LogLevel, message: string, meta: LogMeta): string => {
  const base = { timestamp: new Date().toISOString(), level, message, ...meta };
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(base);
  }
  const metaString = Object.keys(meta).length
    ? ' ' + util.inspect(meta, { depth: null, colors: true })
    : '';
  return `${base.timestamp} [${level.toUpperCase()}] ${message}${metaString}`;
};

const logger = {
  info: (message: string, meta: LogMeta = {}): void => {
    console.log(format('info', message, meta));
  },
  error: (message: string, meta: LogMeta = {}): void => {
    if (meta instanceof Error) {
      meta = { error: meta.message, stack: meta.stack };
    }
    console.error(format('error', message, meta));
  },
};

export default logger;
