import mongoose from 'mongoose';

export const connectDB = async (
  uri: string | undefined = process.env.MONGO_URI
): Promise<void> => {
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};
