import assert from "node:assert/strict";
import test from "node:test";
import { tasks } from "../src/tasks.js";
import { validateTaskResult } from "../src/validators.js";

test("validators accept expected outputs", () => {
  const task = tasks.find(
    (candidate) => candidate.id === "extract-ticket-priority",
  );
  assert.ok(task);

  assert.equal(validateTaskResult(task, "high").passed, true);
});

test("validators reject incorrect outputs", () => {
  const task = tasks.find(
    (candidate) => candidate.id === "extract-ticket-priority",
  );
  assert.ok(task);

  assert.equal(validateTaskResult(task, "urgent").passed, false);
});

test("code-generation validator runs sample tests", () => {
  const task = tasks.find((candidate) => candidate.id === "generate-transform");
  assert.ok(task);

  const valid =
    "function normalizeEmail(value) { return value.trim().toLowerCase(); }";
  const invalid = "function normalizeEmail(value) { return value.trim(); }";

  assert.equal(validateTaskResult(task, valid).passed, true);
  assert.equal(validateTaskResult(task, invalid).passed, false);
});
