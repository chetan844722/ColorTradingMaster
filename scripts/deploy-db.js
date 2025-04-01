import { db } from '../server/db.js';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';

async function runMigration() {
  console.log('Starting database migration...');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Connect directly using pg to run SQL statements
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL
    });

    const client = await pool.connect();
    console.log('Connected to the database');

    // Check if user_subscriptions table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions'
      );
    `);

    if (tableCheckResult.rows[0].exists) {
      console.log('Checking if accumulated_rewards column exists in user_subscriptions table');
      
      // Check if accumulated_rewards column exists
      const rewardsColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'accumulated_rewards'
        );
      `);

      if (!rewardsColumnCheckResult.rows[0].exists) {
        console.log('Adding accumulated_rewards column to user_subscriptions table');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN accumulated_rewards NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
        console.log('accumulated_rewards column added successfully');
      } else {
        console.log('accumulated_rewards column already exists, skipping');
      }

      // Check if total_earnings column exists
      const earningsColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'total_earnings'
        );
      `);

      if (!earningsColumnCheckResult.rows[0].exists) {
        console.log('Adding total_earnings column to user_subscriptions table');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
        console.log('total_earnings column added successfully');
      } else {
        console.log('total_earnings column already exists, skipping');
      }
      
      // Check if total_withdrawn column exists
      const withdrawnColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'total_withdrawn'
        );
      `);

      if (!withdrawnColumnCheckResult.rows[0].exists) {
        console.log('Adding total_withdrawn column to user_subscriptions table');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN total_withdrawn NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
        console.log('total_withdrawn column added successfully');
      } else {
        console.log('total_withdrawn column already exists, skipping');
      }
    } else {
      console.log('user_subscriptions table does not exist yet, skipping column additions');
    }

    // Check if subscriptions table exists
    const subscriptionTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions'
      );
    `);

    if (subscriptionTableCheckResult.rows[0].exists) {
      // Check if level column exists in subscriptions table
      const levelColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions' 
          AND column_name = 'level'
        );
      `);

      if (!levelColumnCheckResult.rows[0].exists) {
        console.log('Adding level column to subscriptions table');
        await client.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
        `);
        console.log('level column added successfully');

        // Update existing subscriptions with levels based on price
        console.log('Updating existing subscription levels');
        await client.query(`
          UPDATE subscriptions SET level = 
          CASE 
            WHEN price = 1000 THEN 1
            WHEN price = 2000 THEN 2
            WHEN price = 10000 THEN 3
            ELSE 1
          END;
        `);
        console.log('Subscription levels updated successfully');
      } else {
        console.log('level column already exists in subscriptions table, skipping');
      }

      // Check if withdrawal_wait_days column exists
      const waitDaysColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions' 
          AND column_name = 'withdrawal_wait_days'
        );
      `);

      if (!waitDaysColumnCheckResult.rows[0].exists) {
        console.log('Adding withdrawal_wait_days column to subscriptions table');
        await client.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN withdrawal_wait_days INTEGER NOT NULL DEFAULT 15;
        `);
        console.log('withdrawal_wait_days column added successfully');
      } else {
        console.log('withdrawal_wait_days column already exists, skipping');
      }
    } else {
      console.log('subscriptions table does not exist yet, skipping column additions');
    }

    await client.release();
    await pool.end();
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('Migration complete, exiting...');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error during migration:', err);
    process.exit(1);
  });