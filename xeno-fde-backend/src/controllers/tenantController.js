import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a tenant
export const createTenant = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tenant name is required" });
    }

    const tenant = await prisma.tenant.create({
      data: { name },
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get tenant with stores
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { stores: true }, // also fetch connected stores
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
