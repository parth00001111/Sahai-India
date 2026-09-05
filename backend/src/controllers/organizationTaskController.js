import streamifier from "streamifier";
import prisma from "../../PrismaClient.js";
import cloudinary from "../config/claudinary.js";

const taskInclude = {
  assignedTo: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { fullName: true } },
    },
  },
  createdBy: { select: { id: true, email: true } },
};

const getMembership = (userId) => prisma.orgMember.findUnique({
  where: { userId },
  include: { organization: { select: { id: true, name: true } } },
});

const uploadEvidence = (fileBuffer, taskId, label) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: `sahai-task-proof/${taskId}`,
      public_id: `${label}-${Date.now()}`,
      resource_type: "image",
    },
    (error, result) => (error ? reject(error) : resolve(result.secure_url)),
  );
  streamifier.createReadStream(fileBuffer).pipe(stream);
});

const cleanOptional = (value, maxLength = 300) => {
  const cleaned = typeof value === "string" ? value.trim() : "";
  return cleaned ? cleaned.slice(0, maxLength) : null;
};

export const getOrganizationTasks = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership) return res.status(403).json({ success: false, message: "You are not connected to an organisation", data: null });

    const tasks = await prisma.orgTask.findMany({
      where: {
        orgId: membership.orgId,
        ...(membership.role === "staff" ? { assignedToId: req.user.userId } : {}),
      },
      include: taskInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return res.json({ success: true, message: "Tasks fetched successfully", data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Unable to load tasks: ${error.message}`, data: null });
  }
};

export const createOrganizationTask = async (req, res) => {
  const { title, description, assignedToId, area, address } = req.body || {};
  if (![title, description, assignedToId, area, address].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ success: false, message: "Title, description, staff member, area, and address are required", data: null });
  }

  try {
    const membership = await getMembership(req.user.userId);
    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only an organisation admin can assign tasks", data: null });
    }

    const assignee = await prisma.orgMember.findFirst({
      where: { orgId: membership.orgId, userId: assignedToId, role: "staff" },
    });
    if (!assignee) return res.status(400).json({ success: false, message: "Choose an active staff member from your organisation", data: null });

    const allowedPriorities = new Set(["low", "medium", "high", "urgent"]);
    const priority = allowedPriorities.has(req.body.priority) ? req.body.priority : "medium";
    const toCoordinate = (value) => {
      if (value === "" || value === undefined || value === null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const task = await prisma.orgTask.create({
      data: {
        orgId: membership.orgId,
        createdById: req.user.userId,
        assignedToId,
        title: title.trim().slice(0, 140),
        description: description.trim().slice(0, 2000),
        complaintReference: cleanOptional(req.body.complaintReference, 100),
        area: area.trim().slice(0, 200),
        address: address.trim().slice(0, 500),
        city: cleanOptional(req.body.city, 100),
        district: cleanOptional(req.body.district, 100),
        state: cleanOptional(req.body.state, 100),
        pincode: cleanOptional(req.body.pincode, 10),
        lat: toCoordinate(req.body.lat),
        lng: toCoordinate(req.body.lng),
        priority,
      },
      include: taskInclude,
    });

    return res.status(201).json({ success: true, message: "Task assigned to staff", data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Unable to create task: ${error.message}`, data: null });
  }
};

export const startOrganizationTask = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership || membership.role !== "staff") {
      return res.status(403).json({ success: false, message: "Only assigned staff can start this task", data: null });
    }

    const task = await prisma.orgTask.findFirst({
      where: { id: req.params.id, orgId: membership.orgId, assignedToId: req.user.userId },
    });
    if (!task) return res.status(404).json({ success: false, message: "Assigned task not found", data: null });
    if (task.status === "completed") return res.status(409).json({ success: false, message: "This task is already completed", data: task });

    const updated = await prisma.orgTask.update({
      where: { id: task.id },
      data: task.status === "assigned" ? { status: "in_progress", startedAt: new Date() } : {},
      include: taskInclude,
    });
    return res.json({ success: true, message: "Task marked in progress", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Unable to start task: ${error.message}`, data: null });
  }
};

export const uploadOrganizationTaskProof = async (req, res) => {
  const beforeFile = req.files?.beforeImage?.[0];
  const afterFile = req.files?.afterImage?.[0];
  if (!beforeFile && !afterFile) return res.status(400).json({ success: false, message: "Select a before or after image", data: null });
  if ([beforeFile, afterFile].filter(Boolean).some((file) => !file.mimetype.startsWith("image/"))) {
    return res.status(400).json({ success: false, message: "Task proof must be a JPG or PNG image", data: null });
  }

  try {
    const membership = await getMembership(req.user.userId);
    if (!membership || membership.role !== "staff") {
      return res.status(403).json({ success: false, message: "Only assigned staff can upload task proof", data: null });
    }

    const task = await prisma.orgTask.findFirst({
      where: { id: req.params.id, orgId: membership.orgId, assignedToId: req.user.userId },
    });
    if (!task) return res.status(404).json({ success: false, message: "Assigned task not found", data: null });
    if (task.status === "completed") return res.status(409).json({ success: false, message: "Completed task proof cannot be replaced", data: task });

    const [beforeImageUrl, afterImageUrl] = await Promise.all([
      beforeFile ? uploadEvidence(beforeFile.buffer, task.id, "before") : Promise.resolve(null),
      afterFile ? uploadEvidence(afterFile.buffer, task.id, "after") : Promise.resolve(null),
    ]);

    const updated = await prisma.orgTask.update({
      where: { id: task.id },
      data: {
        ...(beforeImageUrl ? { beforeImageUrl } : {}),
        ...(afterImageUrl ? { afterImageUrl } : {}),
        ...(req.body.completionNote !== undefined ? { completionNote: cleanOptional(req.body.completionNote, 1000) } : {}),
        ...(task.status === "assigned" ? { status: "in_progress", startedAt: new Date() } : {}),
      },
      include: taskInclude,
    });
    return res.json({ success: true, message: "Task proof saved", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Unable to upload proof: ${error.message}`, data: null });
  }
};

export const completeOrganizationTask = async (req, res) => {
  try {
    const membership = await getMembership(req.user.userId);
    if (!membership || membership.role !== "staff") {
      return res.status(403).json({ success: false, message: "Only assigned staff can complete this task", data: null });
    }

    const task = await prisma.orgTask.findFirst({
      where: { id: req.params.id, orgId: membership.orgId, assignedToId: req.user.userId },
    });
    if (!task) return res.status(404).json({ success: false, message: "Assigned task not found", data: null });
    if (task.status === "completed") return res.json({ success: true, message: "Task is already completed", data: task });
    if (!task.beforeImageUrl || !task.afterImageUrl) {
      return res.status(400).json({ success: false, message: "Both before and after images are required before completing a task", data: task });
    }

    const updated = await prisma.orgTask.update({
      where: { id: task.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ...(req.body?.completionNote !== undefined ? { completionNote: cleanOptional(req.body.completionNote, 1000) } : {}),
      },
      include: taskInclude,
    });
    return res.json({ success: true, message: "Task completed with proof", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Unable to complete task: ${error.message}`, data: null });
  }
};
