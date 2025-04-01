import pkg from 'pg';
const { Pool } = pkg;
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function initializeData() {
  console.log('Starting data initialization...');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const client = await pool.connect();
    console.log('Connected to the database');

    // Check if admin user exists
    const adminCheck = await client.query(`
      SELECT * FROM users WHERE username = 'admin'
    `);

    let adminId = null;

    if (adminCheck.rows.length === 0) {
      console.log('Creating admin user...');
      
      // Create admin user
      const referralCode = randomBytes(4).toString('hex');
      const hashedPassword = await hashPassword('admin123'); // Change this to a secure password
      
      const adminResult = await client.query(`
        INSERT INTO users (username, password, full_name, email, role, referral_code) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `, ['admin', hashedPassword, 'Administrator', 'admin@example.com', 'admin', referralCode]);
      
      adminId = adminResult.rows[0].id;
      console.log('Admin user created successfully with ID:', adminId);

      // Create wallet for admin
      await client.query(`
        INSERT INTO wallets (user_id, balance) 
        VALUES ($1, $2)
      `, [adminId, 0]);

      console.log('Admin wallet created successfully');
    } else {
      console.log('Admin user already exists, skipping creation');
    }

    // Check if default subscriptions exist
    const subscriptionsCheck = await client.query(`
      SELECT * FROM subscriptions
    `);

    if (subscriptionsCheck.rows.length === 0) {
      console.log('Creating default subscriptions...');
      
      // Create default subscriptions
      await client.query(`
        INSERT INTO subscriptions (name, price, daily_reward, total_reward, duration, level, features, is_active, withdrawal_wait_days) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18),
        ($19, $20, $21, $22, $23, $24, $25, $26, $27)
      `, [
        'Basic Plan', 1000, 600, 4200, 7, 1, '["Daily rewards: ₹600/day", "7-day reward period", "Access to all games"]', true, 15,
        'Premium Plan', 2000, 1200, 8400, 7, 2, '["Daily rewards: ₹1,200/day", "7-day reward period", "Premium game access", "Priority support"]', true, 15,
        'VIP Plan', 10000, 11425, 79975, 7, 3, '["Daily rewards: ₹11,425/day", "7-day reward period", "VIP game access", "Dedicated support", "Exclusive bonuses"]', true, 15
      ]);

      console.log('Default subscriptions created successfully');
    } else {
      console.log('Subscriptions already exist, skipping creation');
    }

    await client.release();
    await pool.end();
    
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