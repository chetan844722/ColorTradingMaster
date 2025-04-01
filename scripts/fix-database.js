import pkg from 'pg';
const { Pool } = pkg;

async function fixDatabase() {
  console.log('Starting database fix...');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Connect directly using pg to run SQL statements
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const client = await pool.connect();
    console.log('Connected to the database');

    // Add missing columns to user_subscriptions table
    try {
      console.log('Checking if columns exist in user_subscriptions table...');
      
      // Check if total_earned exists, add if missing
      const totalEarnedCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'total_earned'
        );
      `);
      
      if (!totalEarnedCheck.rows[0].exists) {
        console.log('Adding total_earned column...');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN total_earned NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
      }
      
      // Check if total_withdrawn exists, add if missing
      const totalWithdrawnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'total_withdrawn'
        );
      `);
      
      if (!totalWithdrawnCheck.rows[0].exists) {
        console.log('Adding total_withdrawn column...');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN total_withdrawn NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
      }
      
      // Check if accumulated_winnings exists, add if missing
      const accumulatedWinningsCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'accumulated_winnings'
        );
      `);
      
      if (!accumulatedWinningsCheck.rows[0].exists) {
        console.log('Adding accumulated_winnings column...');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN accumulated_winnings NUMERIC(10, 2) NOT NULL DEFAULT 0;
        `);
      }
      
      // Check if next_withdrawal_date exists, add if missing
      const nextWithdrawalDateCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'user_subscriptions' 
          AND column_name = 'next_withdrawal_date'
        );
      `);
      
      if (!nextWithdrawalDateCheck.rows[0].exists) {
        console.log('Adding next_withdrawal_date column...');
        await client.query(`
          ALTER TABLE user_subscriptions 
          ADD COLUMN next_withdrawal_date TIMESTAMP;
        `);
      }
      
      console.log('User subscriptions table updated successfully');
    } catch (error) {
      console.error('Error updating user_subscriptions table:', error);
    }

    // Add missing columns to subscriptions table
    try {
      console.log('Checking if columns exist in subscriptions table...');
      
      // Check if level exists, add if missing
      const levelCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions' 
          AND column_name = 'level'
        );
      `);
      
      if (!levelCheck.rows[0].exists) {
        console.log('Adding level column...');
        await client.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
        `);
        
        // Update existing subscription levels
        await client.query(`
          UPDATE subscriptions SET level = 
          CASE 
            WHEN price = 1000 THEN 1
            WHEN price = 2000 THEN 2
            WHEN price = 10000 THEN 3
            ELSE 1
          END;
        `);
      }
      
      // Check if withdrawal_wait_days exists, add if missing
      const withdrawalWaitDaysCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions' 
          AND column_name = 'withdrawal_wait_days'
        );
      `);
      
      if (!withdrawalWaitDaysCheck.rows[0].exists) {
        console.log('Adding withdrawal_wait_days column...');
        await client.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN withdrawal_wait_days INTEGER NOT NULL DEFAULT 15;
        `);
      }
      
      console.log('Subscriptions table updated successfully');
    } catch (error) {
      console.error('Error updating subscriptions table:', error);
    }

    await client.release();
    await pool.end();
    
    console.log('Database fix completed successfully!');
  } catch (error) {
    console.error('Error during database fix:', error);
    process.exit(1);
  }
}

fixDatabase()
  .then(() => {
    console.log('Database fix complete, exiting...');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error during database fix:', err);
    process.exit(1);
  });