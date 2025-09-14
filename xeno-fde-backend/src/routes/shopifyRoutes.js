import express from "express";
import { connectStore, getStoresByTenant } from "../controllers/shopifyController.js";
import { protect } from '../middleware/authMiddleware.js'; // <-- Import protect

const router = express.Router();

// Protect these routes
router.post("/connect", protect, connectStore);
router.get("/stores/:tenantId", protect, getStoresByTenant);

export default router;