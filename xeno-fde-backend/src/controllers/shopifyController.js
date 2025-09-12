import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Connect a Shopify store to a tenant
export const connectStore = async (req, res) => {
  try {
    const { tenantId, shopDomain, accessToken } = req.body;

    if (!tenantId || !shopDomain || !accessToken) {
      return res.status(400).json({ error: "tenantId, shopDomain, and accessToken are required" });
    }

    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Create ShopifyStore entry
    const store = await prisma.shopifyStore.create({
      data: {
        tenantId,
        shopDomain,
        accessToken,
      },
    });

    res.status(201).json(store);
  } catch (error) {
    console.error("Error connecting store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all stores for a tenant
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
