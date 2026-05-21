import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    let admin = await User.findOne({ phone: 'K' });
    if (admin) {
      console.log('Admin already exists, updating...');
      admin.password = '123456789';
      admin.name = 'K';
      admin.role = 'admin';
      admin.isVerified = true;
      await admin.save();
    } else {
      await User.create({
        name: 'K',
        phone: 'K',
        password: '123456789',
        role: 'admin',
        isVerified: true
      });
      console.log('Admin created successfully');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
