import axios from "axios";
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

  const requiredDocs = [registrationCertUrl, panDocUrl, addressProofUrl, authLetterUrl, logoUrl];
  const allDocsPresent = requiredDocs.every((doc) => doc && doc.trim() !== "");

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
        verificationStatus: allDocsPresent ? "verified" : "pending",
      },
    });

    return res.status(201).json({
      success: true,
      message: allDocsPresent
        ? "Organization created and verified successfully"
        : "Organization created, pending document verification",
      data: newOrg,
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