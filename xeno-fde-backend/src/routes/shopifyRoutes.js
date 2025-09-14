import express from "express";
import { connectStore, getStoresByTenant } from "../controllers/shopifyController.js";
import { protect } from '../middleware/authMiddleware.js'; // <-- Correctly import 'protect'

const router = express.Router();

// Correctly use the 'protect' middleware function
router.post("/connect", protect, connectStore);
router.get("/stores/:tenantId", protect, getStoresByTenant);

export default router;