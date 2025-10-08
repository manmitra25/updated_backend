// config/redisClient.js
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();


const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    tls: process.env.REDIS_URL.startsWith("rediss://"),
    rejectUnauthorized: false, // optional, for self-signed certs
  }, // fallback to local
});

redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis client connected successfully");
  } catch (err) {
    console.error("🚨 Redis connection failed:", err);
  }
})();

export default redisClient;
