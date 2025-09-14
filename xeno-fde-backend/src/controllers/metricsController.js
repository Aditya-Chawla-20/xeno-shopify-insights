// src/controllers/metricsController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// This middleware will fetch the store for a given tenant
// We assume the frontend will know the tenantId
export const getStoreForTenant = async (req, res, next) => {
    // CONSISTENCY FIX: Get tenantId from the logged-in user, not URL params
    const tenantId = req.user.tenantId;
    
    try {
        const store = await prisma.shopifyStore.findFirst({
            where: { tenantId: tenantId },
        });

        if (!store) {
            return res.status(404).json({ error: "No Shopify store found for this tenant." });
        }

        req.store = store;
        next();
    } catch (error) {
        res.status(500).json({ error: "Failed to verify store for tenant." });
    }
};


// GET /metrics/:tenantId/summary
export const getMetricsSummary = async (req, res) => {
    try {
        const storeId = req.store.id;

        const totalProducts = await prisma.product.count({ where: { storeId } });
        const totalCustomers = await prisma.customer.count({ where: { storeId } });
        const totalOrders = await prisma.order.count({ where: { storeId } });

        const revenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { storeId },
        });

        res.json({
            totalProducts,
            totalCustomers,
            totalOrders,
            totalRevenue: revenue._sum.totalAmount || 0,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch metrics summary." });
    }
};

// GET /metrics/:tenantId/orders-by-date
export const getOrdersByDate = async (req, res) => {
    try {
        const storeId = req.store.id;
        const { startDate, endDate } = req.query;

        const orders = await prisma.order.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: startDate ? new Date(startDate) : new Date(0),
                    lte: endDate ? new Date(endDate) : new Date(),
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        
        // This is a simple aggregation. You could also do this with a more complex SQL query.
        const series = orders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0]; // Group by day
            if (!acc[date]) {
                acc[date] = { count: 0, revenue: 0 };
            }
            acc[date].count++;
            acc[date].revenue += order.totalAmount;
            return acc;
        }, {});

        res.json(Object.entries(series).map(([date, data]) => ({ date, ...data })));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders by date." });
    }
};

// GET /metrics/:tenantId/top-customers
export const getTopCustomers = async (req, res) => {
    try {
        const storeId = req.store.id;

        const topCustomers = await prisma.order.groupBy({
            by: ['customerId'],
            where: { storeId, customerId: { not: null } },
            _sum: { totalAmount: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 5,
        });

        // Fetch customer details for the top customer IDs
        const customerIds = topCustomers.map(c => c.customerId);
        const customers = await prisma.customer.findMany({
            where: { id: { in: customerIds } },
        });

        const customerMap = customers.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
        }, {});

        const result = topCustomers.map(c => ({
            ...customerMap[c.customerId],
            totalSpent: c._sum.totalAmount,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch top customers." });
    }
};