const log = (level, message, meta = {}) => {
    const entry = { timestamp: new Date().toISOString(), level, message, ...meta };
    console.log(JSON.stringify(entry));
};
export default {
    info: (message, meta) => log('info', message, meta),
    error: (message, meta) => log('error', message, meta),
};
