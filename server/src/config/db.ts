import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async (
  uri: string | undefined = process.env.MONGO_URI
): Promise<void> => {
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, { autoIndex: true });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error', { error: err });
    throw err;
  }
};
