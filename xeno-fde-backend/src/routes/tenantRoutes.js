import express from "express";
import { createTenant, getTenantById } from "../controllers/tenantController.js";

const router = express.Router();

router.post("/", createTenant);
router.get("/:id", getTenantById);

export default router;
