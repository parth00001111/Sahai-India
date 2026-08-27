import { createOrg, getAllOrg  } from "../controllers/organizationController.js"; 
import { verifyToken } from "../middleware/authMiddleware.js";
import { Router } from 'express';
import { upload } from "../middleware/multer.js";

const routes = new Router();


routes.post(
  "/organizations",
  upload.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "panDocument", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "authorisedLetter", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createOrg
);
routes.get("/organizations", verifyToken, getAllOrg);
export default routes

