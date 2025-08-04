import logger from '../utils/logger.js';
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl: url } = req;
        const { statusCode } = res;
        const level = statusCode >= 400 ? 'error' : 'info';
        logger[level]('HTTP request', {
            method,
            url,
            statusCode,
            duration,
        });
    });
    next();
};
export default requestLogger;
