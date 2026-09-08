import crypto from "node:crypto";
import prisma from "../../PrismaClient.js";
import { routeComplaint } from "../services/complaintRoutingService.js";
import { validateIndianLocation } from "../services/locationService.js";
import { createComplaintSchema } from "../validation/citizenValidation.js";

const complaintSelect = {
  id: true,
  reference: true,
  title: true,
  category: true,
  routedDepartment: true,
  jurisdiction: true,
  rawText: true,
  address: true,
  city: true,
  district: true,
  state: true,
  pincode: true,
  postOffice: true,
  lat: true,
  lng: true,
  severity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const citizenOnly = (req, res) => {
  if (req.user?.userType === "citizen") return true;
  res.status(403).json({ success: false, message: "Citizen access is required", data: null });
  return false;
};

const createReference = () => {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SHI-${day}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

export const getCitizenDashboard = async (req, res) => {
  if (!citizenOnly(req, res)) return;

  try {
    const [user, complaints, services] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          createdAt: true,
          profile: { select: { fullName: true, preferredLanguage: true, address: true } },
        },
      }),
      prisma.report.findMany({
        where: { userId: req.user.userId },
        select: complaintSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.findMany({
        where: { isActive: true, organization: { verificationStatus: "verified" } },
        select: {
          id: true,
          name: true,
          description: true,
          deliveryMode: true,
          availability: true,
          serviceArea: true,
          contactPhone: true,
          eligibility: true,
          applicationProcess: true,
          feeDetails: true,
          requiredDocuments: true,
          category: { select: { name: true } },
          organization: { select: { id: true, name: true, city: true, state: true, logoUrl: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);

    if (!user) return res.status(404).json({ success: false, message: "Citizen account not found", data: null });

    return res.status(200).json({
      success: true,
      message: "Citizen dashboard loaded",
      data: { user, complaints, services },
    });
  } catch (error) {
    console.error("Unable to load citizen dashboard:", error);
    return res.status(500).json({ success: false, message: "Unable to load your citizen dashboard", data: null });
  }
};

export const createComplaint = async (req, res) => {
  if (!citizenOnly(req, res)) return;
  const result = createComplaintSchema.safeParse(req.body || {});
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues?.[0]?.message || "Check the complaint details",
      errors: result.error.issues,
      data: null,
    });
  }

  const { description, category, ...input } = result.data;
  let verifiedLocation;
  try {
    verifiedLocation = await validateIndianLocation(input);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message, data: null });
  }

  try {
    const routing = routeComplaint(category, verifiedLocation);
    const complaint = await prisma.report.create({
      data: {
        userId: req.user.userId,
        reference: createReference(),
        title: input.title,
        category: routing.category,
        routedDepartment: routing.department,
        jurisdiction: routing.jurisdiction,
        rawText: description,
        address: input.address,
        city: verifiedLocation.city,
        district: verifiedLocation.district,
        state: verifiedLocation.state,
        pincode: verifiedLocation.pincode,
        postOffice: verifiedLocation.postOffice,
        lat: verifiedLocation.lat,
        lng: verifiedLocation.lng,
        locationVerifiedAt: verifiedLocation.locationVerifiedAt,
        severity: input.severity,
      },
      select: complaintSelect,
    });

    return res.status(201).json({
      success: true,
      message: `Complaint recorded and routed to ${routing.department}`,
      data: complaint,
    });
  } catch (error) {
    console.error("Unable to create citizen complaint:", error);
    return res.status(500).json({ success: false, message: "Unable to file the complaint right now", data: null });
  }
};

export const closeComplaint = async (req, res) => {
  if (!citizenOnly(req, res)) return;

  try {
    const existing = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      select: { id: true, status: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: "Complaint not found", data: null });
    if (existing.status === "resolved") {
      return res.status(409).json({ success: false, message: "A resolved complaint cannot be closed", data: null });
    }

    const complaint = await prisma.report.update({
      where: { id: existing.id },
      data: { status: "closed" },
      select: complaintSelect,
    });
    return res.status(200).json({ success: true, message: "Complaint closed", data: complaint });
  } catch (error) {
    console.error("Unable to close citizen complaint:", error);
    return res.status(500).json({ success: false, message: "Unable to close the complaint", data: null });
  }
};
