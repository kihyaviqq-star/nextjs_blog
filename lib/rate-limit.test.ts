import test from "node:test";
import assert from "node:assert/strict";
import rateLimit from "./rate-limit";

test("allows exactly N requests and blocks N+1", async () => {
  const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 10 });
  const token = "test-user-1";

  await assert.doesNotReject(() => limiter.check(3, token));
  await assert.doesNotReject(() => limiter.check(3, token));
  await assert.doesNotReject(() => limiter.check(3, token));
  await assert.rejects(() => limiter.check(3, token), /Rate limit exceeded/);
});

test("tracks tokens independently", async () => {
  const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 10 });

  await assert.doesNotReject(() => limiter.check(1, "token-a"));
  await assert.rejects(() => limiter.check(1, "token-a"), /Rate limit exceeded/);

  await assert.doesNotReject(() => limiter.check(1, "token-b"));
});

test("resets counts after ttl", async () => {
  const limiter = rateLimit({ interval: 80, uniqueTokenPerInterval: 10 });
  const token = "ttl-user";

  await assert.doesNotReject(() => limiter.check(1, token));
  await assert.rejects(() => limiter.check(1, token), /Rate limit exceeded/);

  await new Promise((resolve) => setTimeout(resolve, 120));

  await assert.doesNotReject(() => limiter.check(1, token));
});
