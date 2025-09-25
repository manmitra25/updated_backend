import { createClient } from "redis";
import ChatSummary from "../models/ChatSummary.js";
import { encrypt } from "../utils/encryption.js";
import { v4 as uuidv4 } from "uuid";

// Redis client
const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
await redis.connect();

// ⏳ TTL in seconds (30 min)
const SESSION_TTL = 1800;

// ✅ Start a session
export async function startSession(userId, consent) {
  const sessionId = uuidv4();
  const meta = { userId, consent, startedAt: new Date().toISOString() };

  await redis.set(
    `chat:${sessionId}:meta`,
    JSON.stringify(meta),
    { EX: SESSION_TTL }
  );

  return sessionId;
}

// ✅ Add a message to session
export async function addMessage(sessionId, role, text) {
  const message = { role, text, ts: new Date().toISOString() };
  await redis.rPush(`chat:${sessionId}:messages`, JSON.stringify(message));
  await redis.expire(`chat:${sessionId}:messages`, SESSION_TTL); // refresh expiry
}

// ✅ End session (save summary if consented)
export async function endSession(sessionId) {
  const metaRaw = await redis.get(`chat:${sessionId}:meta`);
  if (!metaRaw) return { message: "Session not found or expired" };

  const meta = JSON.parse(metaRaw);

  // Get all messages
  const messagesRaw = await redis.lRange(`chat:${sessionId}:messages`, 0, -1);
  const messages = messagesRaw.map(m => JSON.parse(m));

  if (meta.consent) {
    // Simple summary generator (replace with GPT or custom)
    const summary = messages.map(m => `${m.role}: ${m.text}`).join("\n");
    const encrypted = encrypt(summary);

    await ChatSummary.create({
      user: meta.userId,
      sessionId,
      summary: encrypted,
      startedAt: meta.startedAt,
      endedAt: new Date()
    });
  }

  // Cleanup Redis
  await redis.del(`chat:${sessionId}:meta`);
  await redis.del(`chat:${sessionId}:messages`);

  return { message: "Session ended", consent: meta.consent };
}
