// Database connectivity check script
// Used to ensure database is available before starting the app
const { Pool } = require('pg');

// Function to test database connection
async function checkDatabaseConnection() {
  // Get PostgreSQL connection details from environment variables
  const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
  };

  // Create a new connection pool
  const pool = new Pool(config);
  
  try {
    console.log('Testing database connection...');
    
    // Simple query to test connectivity
    const result = await pool.query('SELECT NOW() as time');
    console.log(`Database connection successful! Server time: ${result.rows[0].time}`);
    
    // Test for required tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // List of tables the application requires
    const requiredTables = [
      'users', 
      'wallets', 
      'transactions', 
      'subscriptions',
      'user_subscriptions',
      'games',
      'game_rounds',
      'game_bets',
      'referrals',
      'chat_messages',
      'admin_settings'
    ];
    
    // Check for missing tables
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️ WARNING: The following required tables are missing:');
      missingTables.forEach(table => console.log(`  - ${table}`));
      console.log('You might need to run migrations: npm run db:push');
    } else {
      console.log('✅ All required database tables exist!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // For connection-related errors, show more helpful message
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error(`
🔴 Unable to connect to the PostgreSQL database.
Please check:
  - Database server is running
  - Connection URL is correct
  - Network connectivity to the database
  - Firewall rules allow connections
      `);
    } else if (error.code === '28P01') {
      console.error(`
🔐 Authentication failed. 
Please check your database username and password in the DATABASE_URL.
      `);
    } else if (error.code === '3D000') {
      console.error(`
📁 Database does not exist.
Please create the database or check the database name in your DATABASE_URL.
      `);
    }
    
    if (process.env.DB_CHECK_RETRY === 'true') {
      console.log('Will retry connection in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return checkDatabaseConnection();
    }
    
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Check connection and exit with appropriate code
checkDatabaseConnection()
  .then(success => {
    if (!success) {
      console.error('Exiting due to database connection failure.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error in database check:', err);
    process.exit(1);
  });