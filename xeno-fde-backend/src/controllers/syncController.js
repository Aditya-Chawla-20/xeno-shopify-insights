// src/controllers/syncController.js

import { PrismaClient } from "@prisma/client";
import { shopifyRequest } from "../utils/shopifyClient.js";

const prisma = new PrismaClient();

const logSync = async (storeId, entity, status, message) => {
  await prisma.syncLog.create({
    data: { storeId, entity, status, message },
  });
};

// Sync Products
export const syncProducts = async (req, res) => {
  // ... your existing, working syncProducts code ...
  // No changes needed here, but I'm including the full file for completeness.
  const { storeId } = req.body;
  let store;
  try {
    store = await prisma.shopifyStore.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Store not found" });

    const data = await shopifyRequest(store.shopDomain, store.accessToken, "products.json");
    if (!data.products || data.products.length === 0) {
      await logSync(storeId, "PRODUCTS", "SUCCESS", "Shopify store has no products to sync.");
      return res.json({ message: "Shopify store has no products to sync.", count: 0 });
    }

    for (const p of data.products) {
      await prisma.product.upsert({
        where: { shopifyId: p.id.toString() },
        update: { title: p.title, price: parseFloat(p.variants[0]?.price || 0) },
        create: { storeId, shopifyId: p.id.toString(), title: p.title, price: parseFloat(p.variants[0]?.price || 0), currency: "USD" },
      });
    }

    await logSync(storeId, "PRODUCTS", "SUCCESS", `Synced ${data.products.length} products successfully.`);
    res.json({ message: "Products synced successfully", count: data.products.length });
  } catch (error) {
    if (store) await logSync(storeId, "PRODUCTS", "FAILED", error.response?.data?.errors || "An unknown API error occurred.");
    res.status(500).json({ error: "Failed to sync products", details: error.response?.data || { message: error.message } });
  }
};

// Sync Customers
export const syncCustomers = async (req, res) => {
  const { storeId } = req.body;
  let store;
  try {
    store = await prisma.shopifyStore.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Store not found" });

    const data = await shopifyRequest(store.shopDomain, store.accessToken, "customers.json");
    if (!data.customers || data.customers.length === 0) {
        await logSync(storeId, "CUSTOMERS", "SUCCESS", "Shopify store has no customers to sync.");
        return res.json({ message: "Shopify store has no customers to sync.", count: 0 });
    }

    for (const c of data.customers) {
      await prisma.customer.upsert({
        where: { shopifyId: c.id.toString() },
        update: { email: c.email, firstName: c.first_name, lastName: c.last_name },
        create: { storeId, shopifyId: c.id.toString(), email: c.email, firstName: c.first_name, lastName: c.last_name },
      });
    }

    await logSync(storeId, "CUSTOMERS", "SUCCESS", `Synced ${data.customers.length} customers successfully.`);
    res.json({ message: "Customers synced successfully", count: data.customers.length });
  } catch (error) {
    if (store) await logSync(storeId, "CUSTOMERS", "FAILED", error.response?.data?.errors || "An unknown API error occurred.");
    res.status(500).json({ error: "Failed to sync customers", details: error.response?.data || { message: error.message } });
  }
};

// Sync Orders
export const syncOrders = async (req, res) => {
  const { storeId } = req.body;
  let store;
  try {
    store = await prisma.shopifyStore.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Store not found" });

    const data = await shopifyRequest(store.shopDomain, store.accessToken, "orders.json?status=any");
    if (!data.orders || data.orders.length === 0) {
        await logSync(storeId, "ORDERS", "SUCCESS", "Shopify store has no orders to sync.");
        return res.json({ message: "Shopify store has no orders to sync.", count: 0 });
    }

    for (const o of data.orders) {
      // Find the internal customer ID based on the Shopify customer ID
      let internalCustomerId = null;
      if (o.customer) {
        const customer = await prisma.customer.findUnique({ where: { shopifyId: o.customer.id.toString() } });
        if (customer) {
          internalCustomerId = customer.id;
        }
      }

      await prisma.order.upsert({
        where: { shopifyId: o.id.toString() },
        update: { totalAmount: parseFloat(o.total_price || 0), currency: o.currency, customerId: internalCustomerId },
        create: { storeId, shopifyId: o.id.toString(), totalAmount: parseFloat(o.total_price || 0), currency: o.currency, customerId: internalCustomerId },
      });
    }

    await logSync(storeId, "ORDERS", "SUCCESS", `Synced ${data.orders.length} orders successfully.`);
    res.json({ message: "Orders synced successfully", count: data.orders.length });
  } catch (error) {
    if (store) await logSync(storeId, "ORDERS", "FAILED", error.response?.data?.errors || "An unknown API error occurred.");
    res.status(500).json({ error: "Failed to sync orders", details: error.response?.data || { message: error.message } });
  }
};

// Get Sync Logs for a specific store
export const getSyncLogs = async (req, res) => {
  try {
    const { storeId } = req.params;
    const logs = await prisma.syncLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to the last 50 logs
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sync logs" });
  }
};