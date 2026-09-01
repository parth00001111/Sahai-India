import {
  createOrg,
  getAllOrg,
  getMyOrganization,
  updateOrganization,
  updateOrganizationVerification,
  addOrgMember,
  getOrganizationInvitation,
  revokeOrganizationInvitation,
} from "../controllers/organizationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Router } from 'express';
import { upload } from "../middleware/multer.js";
import {
  completeOrganizationTask,
  createOrganizationTask,
  getOrganizationTasks,
  startOrganizationTask,
  uploadOrganizationTaskProof,
} from "../controllers/organizationTaskController.js";

const routes = new Router();


routes.post(
  "/organizations",
  verifyToken,
  upload.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "panDocument", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "authorisedLetter", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createOrg
);
routes.get("/organizations/me", verifyToken, getMyOrganization);
routes.patch("/organizations/me", verifyToken, updateOrganization);
routes.post("/organizations/members", verifyToken, addOrgMember);
routes.get("/organization-invitations/:token", getOrganizationInvitation);
routes.delete("/organizations/invitations/:id", verifyToken, revokeOrganizationInvitation);
routes.get("/organizations/tasks", verifyToken, getOrganizationTasks);
routes.post("/organizations/tasks", verifyToken, createOrganizationTask);
routes.patch("/organizations/tasks/:id/start", verifyToken, startOrganizationTask);
routes.post(
  "/organizations/tasks/:id/proof",
  verifyToken,
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  uploadOrganizationTaskProof,
);
routes.patch("/organizations/tasks/:id/complete", verifyToken, completeOrganizationTask);
routes.patch("/organizations/:id/verification", verifyToken, updateOrganizationVerification);
routes.get("/organizations", verifyToken, getAllOrg);
export default routes
