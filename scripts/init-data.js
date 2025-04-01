import { db } from '../server/db.js';
import { users, wallets, subscriptions } from '../shared/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function initializeData() {
  console.log('Starting data initialization...');

  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));

    if (existingAdmin.length === 0) {
      console.log('Creating admin user...');
      
      // Create admin user
      const [admin] = await db.insert(users).values({
        username: 'admin',
        password: await hashPassword('admin123'), // Change this to a secure password
        fullName: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        referralCode: randomBytes(4).toString('hex')
      }).returning();

      console.log('Admin user created successfully');

      // Create wallet for admin
      await db.insert(wallets).values({
        userId: admin.id,
        balance: 0
      });

      console.log('Admin wallet created successfully');
    } else {
      console.log('Admin user already exists, skipping creation');
    }

    // Check if default subscriptions exist
    const existingSubscriptions = await db.select().from(subscriptions);

    if (existingSubscriptions.length === 0) {
      console.log('Creating default subscriptions...');
      
      // Create default subscriptions
      await db.insert(subscriptions).values([
        {
          name: 'Basic Plan',
          price: 1000,
          dailyReward: 600,
          totalReward: 4200,
          duration: 7,
          level: 1,
          features: ['Daily rewards: ₹600/day', '7-day reward period', 'Access to all games'],
          isActive: true,
          withdrawalWaitDays: 15
        },
        {
          name: 'Premium Plan',
          price: 2000,
          dailyReward: 1200,
          totalReward: 8400,
          duration: 7,
          level: 2,
          features: ['Daily rewards: ₹1,200/day', '7-day reward period', 'Premium game access', 'Priority support'],
          isActive: true,
          withdrawalWaitDays: 15
        },
        {
          name: 'VIP Plan',
          price: 10000,
          dailyReward: 11425,
          totalReward: 79975,
          duration: 7,
          level: 3,
          features: ['Daily rewards: ₹11,425/day', '7-day reward period', 'VIP game access', 'Dedicated support', 'Exclusive bonuses'],
          isActive: true,
          withdrawalWaitDays: 15
        }
      ]);

      console.log('Default subscriptions created successfully');
    } else {
      console.log('Subscriptions already exist, skipping creation');
    }

    console.log('Data initialization completed successfully!');
  } catch (error) {
    console.error('Error during data initialization:', error);
    process.exit(1);
  }
}

initializeData()
  .then(() => {
    console.log('Initialization complete, exiting...');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error during initialization:', err);
    process.exit(1);
  });