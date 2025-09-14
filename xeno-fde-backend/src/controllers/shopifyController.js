import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const connectStore = async (req, res) => {
  try {
    const { tenantId, shopDomain, accessToken } = req.body;
    if (!tenantId || !shopDomain || !accessToken) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Use upsert instead of create to prevent unique constraint errors
    const store = await prisma.shopifyStore.upsert({
      where: { shopDomain: shopDomain }, // Find the store by its unique domain
      update: { accessToken: accessToken, tenantId: tenantId }, // What to update if it exists
      create: { tenantId, shopDomain, accessToken }, // What to create if it doesn't exist
    });

    res.status(201).json(store);
  } catch (error)
 {
    console.error("Error connecting store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStoresByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stores = await prisma.shopifyStore.findMany({
      where: { tenantId },
    });
    res.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};