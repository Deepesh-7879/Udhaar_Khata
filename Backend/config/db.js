import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Database Connection Error: ${error.message}`);
    console.log('🔄 Falling back to local MongoDB database...');
    try {
      const connLocal = await mongoose.connect('mongodb://127.0.0.1:27017/udhaarkhata');
      console.log(`MongoDB Connected (Local Fallback): ${connLocal.connection.host}`);
    } catch (localError) {
      console.error(`Local Database Connection Error: ${localError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
