import mongoose from 'mongoose';

/**
 * Connect to the primary DorMsa database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Create a separate connection to the existing egypt_real_estate database
 * for reading existing property listings.
 * Connects once at startup and caches the connection.
 */
let listingsConnection = null;
let listingsConnectionReady = false;

export const connectListingsDB = async () => {
  const uri = process.env.LISTINGS_DB_URI;
  if (!uri) {
    console.warn('⚠️  LISTINGS_DB_URI not set — external listings disabled');
    return null;
  }
  try {
    listingsConnection = mongoose.createConnection(uri);
    await listingsConnection.asPromise();
    listingsConnectionReady = true;
    console.log('✅ Listings DB Connected (egypt_real_estate)');
    return listingsConnection;
  } catch (error) {
    console.error(`❌ Listings DB Connection Error: ${error.message}`);
    return null;
  }
};

export const getListingsConnection = () => {
  if (listingsConnectionReady && listingsConnection) return listingsConnection;
  return null;
};

export default connectDB;
