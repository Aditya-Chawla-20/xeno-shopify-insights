// src/routes/webhooksRoutes.js
import express from 'express';
import { handleShopifyWebhook } from '../controllers/webhooksController.js';

const router = express.Router();

// A single endpoint to handle all Shopify webhooks
router.post('/shopify', handleShopifyWebhook);

export default router;