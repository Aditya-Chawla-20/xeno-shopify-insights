import express from "express";
import { syncProducts, syncCustomers, syncOrders, getSyncLogs } from "../controllers/syncController.js";
import { protect } from '../middleware/authMiddleware.js'; // <-- Import protect

const router = express.Router();

// Protect all sync routes
router.post("/products", protect, syncProducts);
router.post("/customers", protect, syncCustomers);
router.post("/orders", protect, syncOrders);
router.get("/logs/:storeId", protect, getSyncLogs);

export default router;