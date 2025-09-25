// config/redisClient.js
import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://127.0.0.1:6379", // local Redis
});

// Log errors
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
  console.log("✅ Redis client connected");
})();

export default redisClient;
