// src/controllers/webhooksController.js
import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();

// This function verifies the HMAC signature from Shopify
const verifyShopifyWebhook = (req, secret) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = req.rawBody; // We'll need the raw, unparsed body

    const hash = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    return hmac === hash;
};

// Main handler for all incoming webhooks
export const handleShopifyWebhook = async (req, res) => {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const topic = req.get('X-Shopify-Topic');
    const webhookData = req.body;

    if (!shopDomain) {
        return res.status(400).send('Webhook is missing the shop domain header.');
    }

    try {
        // Find the store in our database to get its secret for verification
        const store = await prisma.shopifyStore.findUnique({
            where: { shopDomain },
        });

        if (!store) {
            console.warn(`Webhook received for unknown shop: ${shopDomain}`);
            return res.status(404).send('Store not found.');
        }

        // --- IMPORTANT: Security Verification ---
        // You'll need to store the "API secret key" from Shopify in your database
        // For now, let's assume you've added a `webhookSecret` field to your ShopifyStore model
        // const isValid = verifyShopifyWebhook(req, store.webhookSecret);
        // if (!isValid) {
        //     console.error('Invalid webhook signature.');
        //     return res.status(401).send('Invalid signature.');
        // }
        // For the assignment, we can proceed without the secret for simplicity, but it's crucial in production.

        console.log(`Webhook received for topic: ${topic}`);

        // Process the webhook based on its topic
        if (topic === 'orders/create') {
            // Logic to upsert the order (similar to your sync controller)
            await prisma.order.upsert({
                where: { shopifyId: webhookData.id.toString() },
                update: { totalAmount: parseFloat(webhookData.total_price || 0) },
                create: {
                    storeId: store.id,
                    shopifyId: webhookData.id.toString(),
                    totalAmount: parseFloat(webhookData.total_price || 0),
                    currency: webhookData.currency,
                    // You'd also handle linking the customer here
                },
            });
            console.log(`Processed new order: ${webhookData.id}`);
        }
        
        // You can add more `if` conditions for other topics like 'products/update', 'customers/create', etc.

        res.status(200).send('Webhook received successfully.');
    } catch (error) {
        console.error('Failed to process webhook:', error);
        res.status(500).send('Error processing webhook.');
    }
};