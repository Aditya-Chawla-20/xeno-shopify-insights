import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const connectStore = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { shopDomain, accessToken } = req.body;

  if (!shopDomain || !accessToken) {
    return res.status(400).json({ error: "Shop domain and access token are required." });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found for the authenticated user." });

    const store = await prisma.shopifyStore.upsert({
      where: { shopDomain: shopDomain },
      update: { accessToken: accessToken, tenantId: tenantId },
      create: { tenantId, shopDomain, accessToken },
    });

    res.status(201).json(store);
  } catch (error) {
    console.error("Error connecting store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStoresByTenant = async (req, res) => {
  const tenantId = req.user.tenantId;
  try {
    const stores = await prisma.shopifyStore.findMany({
      where: { tenantId },
    });
    res.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};