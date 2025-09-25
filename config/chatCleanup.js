import cron from "node-cron";
import redisClient from './redisClient.js';

// Run every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  try {
    const keys = await redisClient.keys("chat:*");
    for (const key of keys) {
      const ttl = await redisClient.ttl(key); // time left
      if (ttl < 0) {
        await redisClient.del(key); // remove expired/abandoned
        console.log(`🧹 Cleaned abandoned chat session: ${key}`);
      }
    }
  } catch (err) {
    console.error("Error in chat cleanup cron:", err.message);
  }
});
