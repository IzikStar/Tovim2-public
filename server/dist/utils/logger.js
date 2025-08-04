import util from 'util';
const format = (level, message, meta) => {
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
    info: (message, meta = {}) => {
        console.log(format('info', message, meta));
    },
    error: (message, meta = {}) => {
        if (meta instanceof Error) {
            meta = { error: meta.message, stack: meta.stack };
        }
        console.error(format('error', message, meta));
    },
};
export default logger;
