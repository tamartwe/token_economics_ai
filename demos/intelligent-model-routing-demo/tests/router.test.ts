import assert from "node:assert/strict";
import test from "node:test";
import { routeTask } from "../src/router.js";
import { tasks } from "../src/tasks.js";

test("low-risk low-complexity tasks initially use the small model", () => {
  const task = tasks.find((candidate) => candidate.id === "extract-email");
  assert.ok(task);

  assert.equal(routeTask(task).model.name, "Small Model");
});

test("high-risk tasks go directly to the strong model", () => {
  const task = tasks.find((candidate) => candidate.id === "security-request");
  assert.ok(task);

  assert.equal(routeTask(task).model.name, "Strong Model");
});
