const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Admin user data
const adminUser = {
  username: 'admin.user',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'ADMIN',
  firstName: 'Admin',
  lastName: 'User',
  points: 0
};

async function seedAdmin() {
  try {
    console.log('Starting database seed...');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminUser.email }
    });

    if (existingAdmin) {
      console.log('Admin user found, updating to use firstname/lastname login...');
      
      // Update the admin user with new username and first/last name
      const updatedAdmin = await prisma.user.update({
        where: { email: adminUser.email },
        data: {
          username: adminUser.username,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          ...(process.env.RESET_ADMIN_PASSWORD === 'true' ? { password: hashedPassword } : {})
        }
      });
      
      console.log('Admin user updated successfully:', updatedAdmin.username);
    } else {
      // Create admin user
      const newAdmin = await prisma.user.create({
        data: {
          ...adminUser,
          password: hashedPassword
        }
      });
      
      console.log('Admin user created successfully:', newAdmin.username);
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin(); 