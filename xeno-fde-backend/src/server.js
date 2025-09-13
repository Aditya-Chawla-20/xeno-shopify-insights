import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Route imports
import authRoutes from "./routes/authRoutes.js";         // <-- NEW: For authentication
import tenantRoutes from "./routes/tenantRoutes.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import webhooksRoutes from "./routes/webhooksRoutes.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// --- Middleware Setup ---

// General middleware
app.use(cors());

// Special middleware for the webhook route
app.use('/webhooks/shopify', express.raw({ type: 'application/json' }), (req, res, next) => {
    req.rawBody = req.body.toString();
    req.body = JSON.parse(req.rawBody);
    next();
});

// General JSON parser for all other routes
app.use(express.json());

// --- API Routes ---
app.use("/auth", authRoutes);                         // <-- NEW: Public routes for login/register
app.use("/tenant", tenantRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/sync", syncRoutes);
app.use("/metrics", metricsRoutes);
app.use("/webhooks", webhooksRoutes);

// --- Default and Health-Check Routes ---
app.get("/", (req, res) => {
  res.send("🚀 Xeno FDE Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running 🚀" });
});

// Example test route to get all users (will fail if you don't have a User model)
app.get("/users", async (req, res) => {
  try {
    // This route might fail if you don't have a `User` model, it's just an example.
    // Our auth uses the `Tenant` model for users.
    const tenantsAsUsers = await prisma.tenant.findMany();
    res.json(tenantsAsUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});