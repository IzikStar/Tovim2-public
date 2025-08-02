import logger from '../utils/logger.js';
const errorHandler = (err, _req, res, _next) => {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
};
export default errorHandler;
