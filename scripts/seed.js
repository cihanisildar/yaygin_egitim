require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ogrtakip';

// Admin user data
const adminUser = {
  username: 'admin.user', // This will match the pattern created in the login page
  email: 'admin@example.com',
  password: 'admin123', // This will be hashed before saving
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define User schema
    const UserSchema = new mongoose.Schema(
      {
        username: {
          type: String,
          required: true,
          unique: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          lowercase: true,
        },
        password: {
          type: String,
          required: true,
          minlength: 6,
        },
        role: {
          type: String,
          enum: ['admin', 'tutor', 'student'],
          default: 'student',
        },
        points: {
          type: Number,
          default: 0,
        },
        tutorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
      },
      { timestamps: true }
    );

    // Pre-save hook to hash password
    UserSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        return next(error);
      }
    });

    // Create or get the User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if admin user already exists
    let existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log('Admin user found, updating to use firstname/lastname login...');
      
      // Update the admin user with new username and first/last name
      existingAdmin.username = adminUser.username;
      existingAdmin.firstName = adminUser.firstName;
      existingAdmin.lastName = adminUser.lastName;
      
      // Only update password if explicitly requested
      if (process.env.RESET_ADMIN_PASSWORD === 'true') {
        existingAdmin.password = adminUser.password; // Will be hashed by pre-save hook
      }
      
      await existingAdmin.save();
      console.log('Admin user updated successfully:', existingAdmin.username);
    } else {
      // Create admin user
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      console.log('Admin user created successfully:', newAdmin.username);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin(); 