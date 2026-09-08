import assert from "node:assert/strict";
import { test } from "node:test";
import citizenRoutes from "../src/routes/citizen.routes.js";
import { verifyToken } from "../src/middleware/authMiddleware.js";

test("citizen routes require authentication and expose dashboard and complaint actions", () => {
  assert.equal(citizenRoutes.stack[0].handle, verifyToken);
  const surface = citizenRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods).sort() }));

  assert.deepEqual(surface, [
    { path: "/dashboard", methods: ["get"] },
    { path: "/complaints", methods: ["post"] },
    { path: "/complaints/:id/close", methods: ["patch"] },
  ]);
});
