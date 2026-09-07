import assert from "node:assert/strict";
import { after, test } from "node:test";
import prisma from "../PrismaClient.js";
import {
  createOrganizationService,
  deleteOrganizationService,
  getOrganizationService,
  getOrganizationServices,
  updateOrganizationService,
} from "../src/controllers/serviceController.js";

const adminMembership = { orgId: "org-1", role: "admin" };
const staffMembership = { orgId: "org-1", role: "staff" };

const request = (overrides = {}) => ({
  user: { userId: "user-1" },
  params: {},
  body: {},
  ...overrides,
});

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const replaceMethod = (t, target, methodName, implementation) => {
  const original = target[methodName];
  const calls = [];

  target[methodName] = async (...args) => {
    calls.push({ arguments: args });
    return implementation(...args);
  };

  t.after(() => {
    target[methodName] = original;
  });

  return {
    mock: {
      calls,
      callCount: () => calls.length,
    },
  };
};

after(async () => {
  await prisma.$disconnect();
});

test("list is scoped to the authenticated member's organisation", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => staffMembership);
  const findMany = replaceMethod(t, prisma.service, "findMany", async () => []);
  const res = response();

  await getOrganizationServices(request(), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data, []);
  assert.deepEqual(findMany.mock.calls[0].arguments[0].where, { orgId: "org-1" });
});

test("single read does not expose another organisation's service", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => staffMembership);
  const findFirst = replaceMethod(t, prisma.service, "findFirst", async () => null);
  const res = response();

  await getOrganizationService(request({ params: { id: "service-2" } }), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.data, null);
  assert.deepEqual(findFirst.mock.calls[0].arguments[0].where, {
    id: "service-2",
    orgId: "org-1",
  });
});

test("staff members cannot create services", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => staffMembership);
  const transaction = replaceMethod(t, prisma, "$transaction", async () => {
    throw new Error("transaction should not run");
  });
  const res = response();

  await createOrganizationService(request(), res);

  assert.equal(res.statusCode, 403);
  assert.equal(transaction.mock.callCount(), 0);
});

test("admin can create a normalized service", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => adminMembership);
  let createArguments;
  replaceMethod(t, prisma, "$transaction", async (operation) => operation({
    problemCategory: {
      findFirst: async () => ({ id: 4, name: "Healthcare" }),
    },
    service: {
      create: async (args) => {
        createArguments = args;
        return { id: "service-1", ...args.data };
      },
    },
  }));
  const res = response();

  await createOrganizationService(request({
    body: {
      name: "  Health camp ",
      category: "healthcare",
      description: "  Weekly health checks ",
      capacity: "25",
    },
  }), res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(createArguments.data, {
    name: "Health camp",
    description: "Weekly health checks",
    capacity: 25,
    isActive: true,
    orgId: "org-1",
    categoryId: 4,
  });
});

test("empty service updates are rejected before persistence", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => adminMembership);
  const findFirst = replaceMethod(t, prisma.service, "findFirst", async () => ({ id: "service-1" }));
  const res = response();

  await updateOrganizationService(request({
    params: { id: "service-1" },
    body: {},
  }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(findFirst.mock.callCount(), 0);
});

test("a service with referrals cannot be deleted", async (t) => {
  replaceMethod(t, prisma.orgMember, "findUnique", async () => adminMembership);
  replaceMethod(t, prisma, "$transaction", async (operation) => operation({
    service: {
      findFirst: async () => ({ id: "service-1", _count: { referrals: 1 } }),
    },
  }));
  const res = response();

  await deleteOrganizationService(request({ params: { id: "service-1" } }), res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /cannot be deleted/i);
});
