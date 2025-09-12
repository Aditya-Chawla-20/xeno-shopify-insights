// src/routes/syncRoutes.js

import express from "express";
import {
  syncProducts,
  syncCustomers,
  syncOrders,
  getSyncLogs
} from "../controllers/syncController.js";

const router = express.Router();

router.post("/products", syncProducts);
router.post("/customers", syncCustomers);
router.post("/orders", syncOrders);
router.get("/logs/:storeId", getSyncLogs); // Note: GET request with param

export default router;