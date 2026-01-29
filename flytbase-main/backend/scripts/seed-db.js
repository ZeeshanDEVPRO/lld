import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../database/connection.js';
import User from '../models/User.js';
import Drone from '../models/Drone.js';

async function seedDatabase() {
  try {
    await connectDB();

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@flytbase.com' });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@flytbase.com',
        password_hash: passwordHash,
        name: 'Admin User',
        role: 'admin'
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample drones
    const drones = [
      {
        name: 'Drone Alpha',
        serial_number: 'DRN-001',
        model: 'FlytBase Pro X1',
        status: 'idle',
        battery_level: 100,
        location: 'Warehouse A',
        health_status: 'healthy'
      },
      {
        name: 'Drone Beta',
        serial_number: 'DRN-002',
        model: 'FlytBase Pro X1',
        status: 'idle',
        battery_level: 95,
        location: 'Warehouse B',
        health_status: 'healthy'
      },
      {
        name: 'Drone Gamma',
        serial_number: 'DRN-003',
        model: 'FlytBase Pro X2',
        status: 'idle',
        battery_level: 88,
        location: 'Warehouse A',
        health_status: 'healthy'
      }
    ];

    for (const droneData of drones) {
      const existing = await Drone.findOne({ serial_number: droneData.serial_number });
      if (!existing) {
        await Drone.create(droneData);
        console.log(`✅ Created drone: ${droneData.name}`);
      } else {
        console.log(`ℹ️  Drone ${droneData.name} already exists`);
      }
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('📝 Default login: admin@flytbase.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();

