import express from "express";
import { protect } from '../middleware/authMiddleware.js'; // <-- Import 'protect'
import {
    getStoreForTenant,
    getMetricsSummary,
    getOrdersByDate,
    getTopCustomers,
    getRevenueOverTime
} from "../controllers/metricsController.js";

const router = express.Router();

// Apply the 'protect' middleware to all routes in this file
router.use(protect);

// This middleware runs for all routes starting with /:tenantId
router.use("/:tenantId", getStoreForTenant);

router.get("/:tenantId/summary", getMetricsSummary);
router.get("/:tenantId/orders-by-date", getOrdersByDate);
router.get("/:tenantId/top-customers", getTopCustomers);
router.get("/:tenantId/revenue-over-time", getRevenueOverTime); 

export default router;