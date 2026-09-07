import { Router } from "express";
import {
  createOrganizationService,
  deleteOrganizationService,
  getOrganizationService,
  getOrganizationServices,
  updateOrganizationService,
} from "../controllers/serviceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const routes = Router();

// Every catalogue operation belongs to the authenticated user's organisation.
routes.use(verifyToken);

routes
  .route("/")
  .get(getOrganizationServices)
  .post(createOrganizationService);

routes
  .route("/:id")
  .get(getOrganizationService)
  .patch(updateOrganizationService)
  .delete(deleteOrganizationService);

export default routes;
