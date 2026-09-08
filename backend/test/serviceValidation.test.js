import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../src/validation/serviceValidation.js";

test("create service input is normalized for persistence", () => {
  const result = createServiceSchema.parse({
    name: "  Community kitchen  ",
    category: " food & NUTRITION ",
    description: "  Daily meals for local residents.  ",
    capacity: "150",
    deliveryMode: "at_centre",
    availability: " Daily, 12 PM–2 PM ",
    serviceArea: " Central district ",
    contactPhone: " +91 98765 43210 ",
    eligibility: " Open to all residents ",
    applicationProcess: " Visit the community centre ",
    feeDetails: " Free of cost ",
  });

  assert.deepEqual(result, {
    name: "Community kitchen",
    category: "Food & nutrition",
    description: "Daily meals for local residents.",
    capacity: 150,
    deliveryMode: "at_centre",
    availability: "Daily, 12 PM–2 PM",
    serviceArea: "Central district",
    contactPhone: "+91 98765 43210",
    eligibility: "Open to all residents",
    applicationProcess: "Visit the community centre",
    feeDetails: "Free of cost",
    isActive: true,
  });
});

test("create service rejects unsupported and unknown input", () => {
  const result = createServiceSchema.safeParse({
    name: "Community kitchen",
    category: "Unsupported category",
    description: "Daily meals",
    deliveryMode: "at_centre",
    availability: "Daily",
    serviceArea: "Central district",
    contactPhone: "9876543210",
    eligibility: "Open to all",
    applicationProcess: "Walk in",
    feeDetails: "Free",
    unexpected: true,
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "category"));
  assert.ok(result.error.issues.some((issue) => issue.code === "unrecognized_keys"));
});

test("update service requires at least one supported field", () => {
  const result = updateServiceSchema.safeParse({});

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "Provide at least one service field to update");
});

test("update service supports a status-only change", () => {
  assert.deepEqual(updateServiceSchema.parse({ isActive: false }), {
    isActive: false,
  });
});
