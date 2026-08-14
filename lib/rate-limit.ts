import { LRUCache } from "lru-cache";

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: Options) {
  const interval = options?.interval || 60000;
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: interval,
  });

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  return {
    check: async (limit: number, token: string) => {
      // 1. If Upstash Redis credentials exist, use distributed rate limiting
      if (redisUrl && redisToken) {
        try {
          const key = `rate-limit:${token}`;
          const expireSec = Math.max(1, Math.ceil(interval / 1000));
          
          // Pipeline incr and expire in Redis REST API
          const response = await fetch(`${redisUrl}/pipeline`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${redisToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              ["INCR", key],
              ["EXPIRE", key, expireSec],
            ]),
          });

          if (response.ok) {
            const data = await response.json();
            const currentUsage = data?.[0]?.result || 0;
            if (currentUsage > limit) {
              throw new Error("Rate limit exceeded");
            }
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.message === "Rate limit exceeded") {
            throw error;
          }
          // Fallback to local cache on redis connection errors
        }
      }

      // 2. In-memory LRU Cache fallback
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
      } else {
        tokenCount[0] += 1;
        tokenCache.set(token, tokenCount);
      }
      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage > limit;

      if (isRateLimited) {
        throw new Error("Rate limit exceeded");
      }
    },
  };
}
