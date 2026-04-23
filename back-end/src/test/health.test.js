import { test } from "node:test";
import assert from "node:assert/strict";
import { healthService } from "../services/health.service.js";

test("health service returns the expected shape", async () => {
  const result = await healthService.getHealth();

  assert.equal(result.status, "ok");
  assert.equal(typeof result.service, "string");
  assert.equal(typeof result.timestamp, "string");
  assert.equal(typeof result.uptimeSeconds, "number");
  assert.equal(typeof result.database.connected, "boolean");
});
