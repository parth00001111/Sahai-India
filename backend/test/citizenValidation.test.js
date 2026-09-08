import assert from "node:assert/strict";
import { test } from "node:test";
import { createComplaintSchema } from "../src/validation/citizenValidation.js";

const validComplaint = {
  title: "Overflowing waste near the market",
  category: "sanitation",
  description: "Waste has not been collected for several days and blocks the footpath.",
  severity: "high",
  address: "Main market road, near community hall",
  city: "Noida",
  district: "Gautam Buddha Nagar",
  state: "Uttar Pradesh",
  pincode: "201301",
  postOffice: "Noida",
  lat: "28.5355",
  lng: "77.3910",
};

test("citizen complaint input is trimmed and coordinates are normalized", () => {
  const result = createComplaintSchema.parse({
    ...validComplaint,
    title: `  ${validComplaint.title}  `,
  });

  assert.equal(result.title, validComplaint.title);
  assert.equal(result.lat, 28.5355);
  assert.equal(result.lng, 77.391);
});

test("citizen complaint rejects unsupported categories and incomplete locations", () => {
  const result = createComplaintSchema.safeParse({
    ...validComplaint,
    category: "noise",
    pincode: "123",
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "category"));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "pincode"));
});
