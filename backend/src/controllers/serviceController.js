import prisma from "../../PrismaClient.js";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validation/serviceValidation.js";

const serviceInclude = {
  category: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
};

const getMembership = (userId) => prisma.orgMember.findUnique({
  where: { userId },
  select: {
    orgId: true,
    role: true,
  },
});

const sendValidationError = (res, error) => res.status(400).json({
  success: false,
  message: error.issues?.[0]?.message || "Validation failed",
  errors: error.issues || [],
  data: null,
});

const sendMembershipError = (res) => res.status(403).json({
  success: false,
  message: "You are not connected to an organisation",
  data: null,
});

const sendAdminError = (res) => res.status(403).json({
  success: false,
  message: "Only the organisation admin can manage services",
  data: null,
});

const resolveCategory = async (tx, canonicalName) => {
  const existingCategory = await tx.problemCategory.findFirst({
    where: {
      name: {
        equals: canonicalName,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) return existingCategory;

  // Validation converts every supported spelling/case to one canonical name.
  // Upsert makes concurrent first-use requests converge on the same row.
  return tx.problemCategory.upsert({
    where: { name: canonicalName },
    update: {},
    create: { name: canonicalName },
  });
};

const logAndSendServerError = (res, action, error) => {
  console.error(`${action}:`, error);
  return res.status(500).json({
    success: false,
    message: "Something went wrong while managing organisation services",
    data: null,
  });
};

export const getOrganizationServices = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership) return sendMembershipError(res);

    const services = await prisma.service.findMany({
      where: { orgId: membership.orgId },
      include: serviceInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Organisation services fetched successfully",
      data: services,
    });
  } catch (error) {
    return logAndSendServerError(res, "Unable to fetch organisation services", error);
  }
};

export const createOrganizationService = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership) return sendMembershipError(res);
    if (membership.role !== "admin") return sendAdminError(res);

    const result = createServiceSchema.safeParse(req.body || {});
    if (!result.success) return sendValidationError(res, result.error);

    const { category: categoryName, ...serviceData } = result.data;
    const service = await prisma.$transaction(async (tx) => {
      const category = await resolveCategory(tx, categoryName);

      return tx.service.create({
        data: {
          ...serviceData,
          orgId: membership.orgId,
          categoryId: category.id,
        },
        include: serviceInclude,
      });
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    return logAndSendServerError(res, "Unable to create organisation service", error);
  }
};

export const updateOrganizationService = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership) return sendMembershipError(res);
    if (membership.role !== "admin") return sendAdminError(res);

    const result = updateServiceSchema.safeParse(req.body || {});
    if (!result.success) return sendValidationError(res, result.error);

    const existingService = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        orgId: membership.orgId,
      },
      select: { id: true },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found in your organisation",
        data: null,
      });
    }

    const { category: categoryName, ...serviceData } = result.data;
    const service = await prisma.$transaction(async (tx) => {
      let categoryId;
      if (categoryName !== undefined) {
        const category = await resolveCategory(tx, categoryName);
        categoryId = category.id;
      }

      return tx.service.update({
        where: { id: existingService.id },
        data: {
          ...serviceData,
          ...(categoryId !== undefined ? { categoryId } : {}),
        },
        include: serviceInclude,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    if (error?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Service not found in your organisation",
        data: null,
      });
    }

    return logAndSendServerError(res, "Unable to update organisation service", error);
  }
};

export const deleteOrganizationService = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership) return sendMembershipError(res);
    if (membership.role !== "admin") return sendAdminError(res);

    const deletedServiceId = await prisma.$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        where: {
          id: req.params.id,
          orgId: membership.orgId,
        },
        select: {
          id: true,
          _count: { select: { referrals: true } },
        },
      });

      if (!service) {
        const error = new Error("Service not found in your organisation");
        error.statusCode = 404;
        throw error;
      }

      if (service._count.referrals > 0) {
        const error = new Error(
          "This service has referrals and cannot be deleted. Pause it instead.",
        );
        error.statusCode = 409;
        throw error;
      }

      await tx.eligibilityRule.deleteMany({
        where: { serviceId: service.id },
      });
      await tx.service.delete({ where: { id: service.id } });

      return service.id;
    });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      data: { id: deletedServiceId },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    // Covers a referral created concurrently after the count but before delete.
    if (error?.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "This service is in use and cannot be deleted. Pause it instead.",
        data: null,
      });
    }

    return logAndSendServerError(res, "Unable to delete organisation service", error);
  }
};
