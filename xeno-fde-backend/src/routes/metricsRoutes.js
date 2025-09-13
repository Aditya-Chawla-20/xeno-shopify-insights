// src/routes/metricsRoutes.js
import express from "express";
import { protect } from '../middleware/authMiddleware.js';
import {
    getStoreForTenant,
    getMetricsSummary,
    getOrdersByDate,
    getTopCustomers
} from "../controllers/metricsController.js";

const router = express.Router();

router.use(protect); 
// This middleware runs for all routes starting with /:tenantId
router.use("/:tenantId", getStoreForTenant);

router.get("/:tenantId/summary", getMetricsSummary);
router.get("/:tenantId/orders-by-date", getOrdersByDate);
router.get("/:tenantId/top-customers", getTopCustomers);

export default router;