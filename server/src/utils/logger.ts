interface LogMeta {
  [key: string]: any;
}

const log = (level: 'info' | 'error', message: string, meta: LogMeta = {}): void => {
  const entry = { timestamp: new Date().toISOString(), level, message, ...meta };
  console.log(JSON.stringify(entry));
};

export default {
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
};
