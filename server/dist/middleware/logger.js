import logger from '../utils/logger.js';
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;
        const level = statusCode >= 400 ? 'error' : 'info';
        logger[level](`${method} ${originalUrl} ${statusCode} ${duration}ms`);
    });
    next();
};
export default requestLogger;
