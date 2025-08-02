import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI as string;

// TODO: Add additional connection options if needed
export const connectDB = async (): Promise<void> => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};
