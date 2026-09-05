import axios from "axios";
import crypto from "node:crypto";
import streamifier from "streamifier";
import prisma from "../../PrismaClient.js";
import cloudinary from "../config/claudinary.js";
import { createOrganizationSchema } from "../validation/organizationValidation.js";

const geocodeAddress = async (address) => {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: address, format: "json", limit: 1 },
      headers: { "User-Agent": "SAATHI211India/1.0" },
    });
    if (response.data.length === 0) return { lat: null, lng: null };
    return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return { lat: null, lng: null };
  }
};

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const createOrg = async (req, res) => {
  const files = req.files || {};
  const body = req.body || {};
  const fileUrls = {};

  if (req.user?.userType !== "org_staff") {
    return res.status(403).json({
      success: false,
      message: "Only organisation staff can submit an organisation application",
      data: null,
    });
  }

  try {
    const existingMembership = await prisma.orgMember.findUnique({
      where: { userId: req.user.userId },
      include: { organization: true },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: "Your account is already connected to an organisation",
        data: existingMembership.organization,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to check your organisation account: " + err.message,
      data: null,
    });
  }

  try {
    for (const field of [
      "registrationCertificate",
      "panDocument",
      "addressProof",
      "authorisedLetter",
      "logo",
    ]) {
      if (files[field]?.[0]) {
        fileUrls[field] = await uploadToCloudinary(files[field][0].buffer, "sahai-org-docs");
      }
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "File upload failed: " + err.message,
      data: null,
    });
  }

  const bodyWithUrls = {
    ...body,
    beneficiariesCount: body.beneficiariesCount ? Number(body.beneficiariesCount) : undefined,
    yearEstablished: body.yearEstablished ? Number(body.yearEstablished) : undefined,
    focusAreas:
      typeof body.focusAreas === "string" ? JSON.parse(body.focusAreas) : body.focusAreas,
    registrationCertUrl: fileUrls.registrationCertificate,
    panDocUrl: fileUrls.panDocument,
    addressProofUrl: fileUrls.addressProof,
    authLetterUrl: fileUrls.authorisedLetter,
    logoUrl: fileUrls.logo,
  };

  const result = createOrganizationSchema.safeParse(bodyWithUrls);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
      data: null,
    });
  }

  const {
    name,
    type,
    legalStructure,
    registrationNumber,
    yearEstablished,
    website,
    description,
    contactName,
    designation,
    email,
    contactPhone,
    address,
    city,
    district,
    state,
    pincode,
    serviceAreas,
    beneficiariesCount,
    focusAreas,
    registrationCertUrl,
    panDocUrl,
    addressProofUrl,
    authLetterUrl,
    logoUrl,
  } = result.data;

  const fullAddress = `${address ? address + ", " : ""}${city}, ${district}, ${state}, ${pincode}`;
  const { lat, lng } = await geocodeAddress(fullAddress);

  try {
    const newOrg = await prisma.organization.create({
      data: {
        name,
        type,
        legalStructure,
        registrationNumber,
        yearEstablished,
        website,
        description,
        contactName,
        designation,
        email,
        contactPhone,
        address,
        city,
        district,
        state,
        pincode,
        lat,
        lng,
        serviceAreas,
        beneficiariesCount,
        focusAreas,
        registrationCertUrl,
        panDocUrl,
        addressProofUrl,
        authLetterUrl,
        logoUrl,
        verificationStatus: "pending",
        members: {
          create: {
            userId: req.user.userId,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                profile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization created, pending document verification",
      data: {
        ...newOrg,
        services: [],
        invitations: [],
        currentUserRole: "admin",
      },
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Your account is already connected to an organisation",
        data: null,
      });
    }

    console.log(err.message);
    return res.status(502).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
};

export const getMyOrganization = async (req, res) => {
  if (req.user?.userType !== "org_staff") {
    return res.status(403).json({
      success: false,
      message: "Only organisation staff can access an organisation workspace",
      data: null,
    });
  }

  try {
    const membership = await prisma.orgMember.findUnique({
      where: { userId: req.user.userId },
      include: {
        organization: {
          include: {
            services: {
              include: {
                category: {
                  select: { id: true, name: true, description: true },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            members: {
              select: {
                id: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    profile: { select: { fullName: true } },
                  },
                },
              },
            },
            invitations: {
              where: {
                status: "pending",
                expiresAt: { gt: new Date() },
              },
              select: {
                id: true,
                email: true,
                role: true,
                token: true,
                expiresAt: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Organisation onboarding has not been completed",
        data: null,
      });
    }

    const { invitations, ...organization } = membership.organization;

    return res.status(200).json({
      success: true,
      message: "Organisation workspace fetched successfully",
      data: {
        ...organization,
        invitations: membership.role === "admin" ? invitations : [],
        currentUserRole: membership.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to load the organisation workspace: " + err.message,
      data: null,
    });
  }
};

export const addOrgMember = async (req, res) => {
  if (req.user?.userType !== "org_staff") {
    return res.status(403).json({
      success: false,
      message: "Only organisation staff can add members",
      data: null,
    });
  }

  const { email: requestedEmail, role } = req.body || {};
  const email = requestedEmail?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Member email is required",
      data: null,
    });
  }

  const memberRole = role === "admin" ? "admin" : "staff";

  try {
    const adminMembership = await prisma.orgMember.findFirst({
      where: { userId: req.user.userId, role: "admin" },
    });

    if (!adminMembership) {
      return res.status(403).json({
        success: false,
        message: "Only the organisation admin can add members",
        data: null,
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });

    if (!targetUser) {
      const invitation = await prisma.orgInvitation.upsert({
        where: {
          orgId_email: {
            orgId: adminMembership.orgId,
            email,
          },
        },
        update: {
          role: memberRole,
          token: crypto.randomBytes(32).toString("hex"),
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          acceptedAt: null,
        },
        create: {
          orgId: adminMembership.orgId,
          email,
          role: memberRole,
          token: crypto.randomBytes(32).toString("hex"),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return res.status(201).json({
        success: true,
        message: "Invitation created. Share the secure link with this team member",
        data: { kind: "invitation", ...invitation },
      });
    }

    if (targetUser.userType !== "org_staff") {
      return res.status(409).json({
        success: false,
        message: "This email belongs to a citizen account. Ask the user to register with another email as organisation staff",
        data: null,
      });
    }

    const existingMembership = await prisma.orgMember.findUnique({
      where: { userId: targetUser.id },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: "This user is already part of an organisation",
        data: null,
      });
    }

    const newMember = await prisma.orgMember.create({
      data: {
        orgId: adminMembership.orgId,
        userId: targetUser.id,
        role: memberRole,
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Member added to organisation",
      data: { kind: "member", ...newMember },
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This user is already part of an organisation",
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to add member: " + err.message,
      data: null,
    });
  }
};

export const updateOrganization = async (req, res) => {
  if (req.user?.userType !== "org_staff") {
    return res.status(403).json({
      success: false,
      message: "Only organisation staff can update organisation details",
      data: null,
    });
  }

  const LOCKED_DOC_FIELDS = [
    "registrationCertUrl",
    "panDocUrl",
    "addressProofUrl",
    "authLetterUrl",
  ];

  try {
    const adminMembership = await prisma.orgMember.findFirst({
      where: { userId: req.user.userId, role: "admin" },
      include: { organization: true },
    });

    if (!adminMembership) {
      return res.status(403).json({
        success: false,
        message: "Only the organisation admin can update organisation details",
        data: null,
      });
    }

    const org = adminMembership.organization;
    const body = req.body || {};

    const updateData = { ...body };
    for (const field of LOCKED_DOC_FIELDS) {
      delete updateData[field];
    }

    if (updateData.focusAreas && typeof updateData.focusAreas === "string") {
      updateData.focusAreas = JSON.parse(updateData.focusAreas);
    }
    if (updateData.beneficiariesCount) {
      updateData.beneficiariesCount = Number(updateData.beneficiariesCount);
    }

    const result = createOrganizationSchema.partial().safeParse(updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: null,
      });
    }

    for (const field of LOCKED_DOC_FIELDS) {
      delete result.data[field];
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: result.data,
    });

    return res.status(200).json({
      success: true,
      message: "Organisation details updated",
      data: updatedOrg,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to update organisation: " + err.message,
      data: null,
    });
  }
};

export const updateOrganizationVerification = async (req, res) => {
  if (req.user?.userType !== "platform_admin") {
    return res.status(403).json({
      success: false,
      message: "Only platform administrators can verify organisations",
      data: null,
    });
  }

  const { status } = req.body || {};
  if (!["pending", "verified", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be pending, verified, or rejected",
      data: null,
    });
  }

  try {
    const organization = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: status,
        verifiedBy: status === "verified" ? req.user.userId : null,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Organisation status updated to ${status}`,
      data: organization,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Organisation not found",
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update organisation status: " + err.message,
      data: null,
    });
  }
};

export const getAllOrg = async (req, res) => {
  const { userType } = req.user;

  if (userType !== "citizen" && userType !== "platform_admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view organizations",
      data: null,
    });
  }

  try {
    const organizations = await prisma.organization.findMany({
      where: { verificationStatus: "verified" },
    });

    return res.status(200).json({
      success: true,
      message: "Organizations fetched successfully",
      data: organizations,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(502).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
};

export const getOrganizationInvitation = async (req, res) => {
  try {
    const invitation = await prisma.orgInvitation.findUnique({
      where: { token: req.params.token },
      include: {
        organization: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "This organisation invitation is invalid or has expired",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organisation invitation is valid",
      data: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        organization: invitation.organization,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to load this invitation: " + err.message,
      data: null,
    });
  }
};

export const revokeOrganizationInvitation = async (req, res) => {
  if (req.user?.userType !== "org_staff") {
    return res.status(403).json({ success: false, message: "Only organisation staff can manage invitations", data: null });
  }

  try {
    const adminMembership = await prisma.orgMember.findFirst({
      where: { userId: req.user.userId, role: "admin" },
    });
    if (!adminMembership) {
      return res.status(403).json({ success: false, message: "Only the organisation admin can revoke invitations", data: null });
    }

    const invitation = await prisma.orgInvitation.findFirst({
      where: { id: req.params.id, orgId: adminMembership.orgId, status: "pending" },
    });
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Pending invitation not found", data: null });
    }

    await prisma.orgInvitation.update({
      where: { id: invitation.id },
      data: { status: "revoked" },
    });
    return res.status(200).json({ success: true, message: "Invitation revoked", data: null });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to revoke invitation: " + err.message, data: null });
  }
};
