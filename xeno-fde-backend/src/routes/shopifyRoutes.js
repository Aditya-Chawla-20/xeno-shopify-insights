import express from "express";
import { connectStore, getStoresByTenant } from "../controllers/shopifyController.js";

const router = express.Router();

router.post("/connect", connectStore);
router.get("/stores/:tenantId", getStoresByTenant);

export default router;
