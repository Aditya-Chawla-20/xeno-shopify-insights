import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();

/*
// NOTE: This security function is not used in the assignment for simplicity,
// but it is crucial for a production application.
const verifyShopifyWebhook = (req, secret) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = req.rawBody;
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return hmac === hash;
};
*/

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
            let internalCustomerId = null;
            if (webhookData.customer && webhookData.customer.id) {
                const customerRecord = await prisma.customer.findUnique({
                    where: { shopifyId: webhookData.customer.id.toString() }
                });
                if (customerRecord) {
                    internalCustomerId = customerRecord.id;
                }
            }
            
            await prisma.order.upsert({
                where: { shopifyId: webhookData.id.toString() },
                update: { 
                    totalAmount: parseFloat(webhookData.total_price || 0),
                    customerId: internalCustomerId
                },
                create: {
                    storeId: store.id,
                    shopifyId: webhookData.id.toString(),
                    totalAmount: parseFloat(webhookData.total_price || 0),
                    currency: webhookData.currency,
                    customerId: internalCustomerId,
                },
            });
            console.log(`Processed new order: ${webhookData.id}`);
        }
        
        res.status(200).send('Webhook received successfully.');
    } catch (error) {
        console.error('Failed to process webhook:', error);
        res.status(500).send('Error processing webhook.');
    }
};