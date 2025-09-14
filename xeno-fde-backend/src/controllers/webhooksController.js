import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();

// This function is for security but is not used in the final version for simplicity.
const verifyShopifyWebhook = (req, secret) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = req.rawBody;
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return hmac === hash;
};

export const handleShopifyWebhook = async (req, res) => {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const topic = req.get('X-Shopify-Topic');
    const webhookData = req.body;

    if (!shopDomain) {
        return res.status(400).send('Webhook is missing the shop domain header.');
    }

    try {
        const store = await prisma.shopifyStore.findUnique({
            where: { shopDomain },
        });

        if (!store) {
            return res.status(404).send('Store not found.');
        }

        console.log(`Webhook received for topic: ${topic}`);

        if (topic === 'orders/create') {
            // --- THIS IS THE CRUCIAL NEW LOGIC ---
            let internalCustomerId = null;

            // 1. Check if the order data from Shopify includes a customer.
            if (webhookData.customer && webhookData.customer.id) {
                // 2. Find that customer in our own database using their Shopify ID.
                const customerRecord = await prisma.customer.findUnique({
                    where: { shopifyId: webhookData.customer.id.toString() }
                });

                // 3. If we find them, get their internal database ID.
                if (customerRecord) {
                    internalCustomerId = customerRecord.id;
                }
            }
            
            // 4. Create the order and correctly link it to the customer.
            await prisma.order.upsert({
                where: { shopifyId: webhookData.id.toString() },
                update: { 
                    totalAmount: parseFloat(webhookData.total_price || 0),
                    customerId: internalCustomerId // Link to customer
                },
                create: {
                    storeId: store.id,
                    shopifyId: webhookData.id.toString(),
                    totalAmount: parseFloat(webhookData.total_price || 0),
                    currency: webhookData.currency,
                    customerId: internalCustomerId, // Link to customer
                },
            });
            // --- END OF FIX ---
            console.log(`Processed new order: ${webhookData.id}`);
        }
        
        res.status(200).send('Webhook received successfully.');
    } catch (error) {
        console.error('Failed to process webhook:', error);
        res.status(500).send('Error processing webhook.');
    }
};