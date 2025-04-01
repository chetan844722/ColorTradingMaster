// Daily rewards processing script
// Used to automatically process subscription rewards for all users
const { Client } = require('pg');
const { differenceInHours, addDays } = require('date-fns');

// Function to process daily rewards
async function processRewards() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start a transaction for the entire process
    await client.query('BEGIN');

    // Get all active subscriptions
    const subscriptionsResult = await client.query(`
      SELECT 
        us.id as subscription_id, 
        us.user_id, 
        us.subscription_id as plan_id, 
        us.last_reward_date, 
        us.total_earned, 
        s.daily_reward, 
        s.name as subscription_name
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.is_active = true
    `);

    const activeSubscriptions = subscriptionsResult.rows;
    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    let processed = 0;
    let skipped = 0;
    const now = new Date();

    // Process each subscription
    for (const subscription of activeSubscriptions) {
      try {
        const lastRewardDate = subscription.last_reward_date 
          ? new Date(subscription.last_reward_date)
          : null;

        // If last reward was over 24 hours ago or never given
        if (!lastRewardDate || differenceInHours(now, lastRewardDate) >= 24) {
          console.log(`Processing reward for user ${subscription.user_id}, subscription ${subscription.subscription_id}`);
          
          // Update user's wallet
          await client.query(`
            UPDATE wallets 
            SET balance = balance + $1, updated_at = NOW()
            WHERE user_id = $2
          `, [subscription.daily_reward, subscription.user_id]);
          
          // Update subscription last reward date and total earned
          await client.query(`
            UPDATE user_subscriptions 
            SET last_reward_date = NOW(), 
                total_earned = total_earned + $1,
                updated_at = NOW()
            WHERE id = $2
          `, [subscription.daily_reward, subscription.subscription_id]);
          
          // Create transaction record
          await client.query(`
            INSERT INTO transactions 
            (user_id, amount, type, status, description, created_at, updated_at)
            VALUES 
            ($1, $2, 'reward', 'completed', $3, NOW(), NOW())
          `, [
            subscription.user_id, 
            subscription.daily_reward, 
            `Daily reward: ${subscription.subscription_name} subscription`
          ]);
          
          processed++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing reward for subscription ${subscription.subscription_id}:`, error);
      }
    }

    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`Successfully processed ${processed} rewards, skipped ${skipped}`);
    return { processed, skipped };
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error in rewards processing:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the process if called directly
if (require.main === module) {
  processRewards()
    .then(result => {
      console.log('Daily rewards processing completed:', result);
    })
    .catch(error => {
      console.error('Daily rewards processing failed:', error);
      process.exit(1);
    });
}

module.exports = { processRewards };