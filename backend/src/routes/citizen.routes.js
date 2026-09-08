import { Router } from "express";
import { closeComplaint, createComplaint, getCitizenDashboard } from "../controllers/citizenController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const routes = Router();

routes.use(verifyToken);
routes.get("/dashboard", getCitizenDashboard);
routes.post("/complaints", createComplaint);
routes.patch("/complaints/:id/close", closeComplaint);

export default routes;
