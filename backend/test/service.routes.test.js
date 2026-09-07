import assert from "node:assert/strict";
import { after, test } from "node:test";
import prisma from "../PrismaClient.js";
import serviceRoutes from "../src/routes/service.routes.js";
import { verifyToken } from "../src/middleware/authMiddleware.js";

after(async () => {
  await prisma.$disconnect();
});

test("service router protects every endpoint and exposes complete CRUD routes", () => {
  assert.equal(serviceRoutes.stack[0].handle, verifyToken);

  const surface = serviceRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));

  assert.deepEqual(surface, [
    { path: "/", methods: ["get", "post"] },
    { path: "/:id", methods: ["delete", "get", "patch"] },
  ]);
});
