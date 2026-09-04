import assert from "node:assert/strict";
import { releaseBatchSchema } from "../src/release_alert.js";

const parsed = releaseBatchSchema.safeParse({ release: "2026.09.03", recipients: ["+15551234567"] });
assert.equal(parsed.success, true);
assert.equal(releaseBatchSchema.safeParse({ release: "", recipients: [] }).success, false);
console.log("release request boundary: ok");
