import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Route imports
import tenantRoutes from "./routes/tenantRoutes.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import webhooksRoutes from "./routes/webhooksRoutes.js"; // 1. Import webhook routes

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// --- Middleware Setup ---

// General middleware
app.use(cors());

// 2. Special middleware for the webhook route ONLY
// This must come BEFORE the general express.json() parser.
// It captures the raw request body, which is needed for HMAC signature verification.
app.use('/webhooks/shopify', express.raw({ type: 'application/json' }), (req, res, next) => {
    // Store the raw body as a string for the verification function
    req.rawBody = req.body.toString();
    // Then, parse the body as JSON for the controller to use
    req.body = JSON.parse(req.rawBody);
    next();
});

// General JSON parser for all other routes
app.use(express.json());

// --- API Routes ---
app.use("/tenant", tenantRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/sync", syncRoutes);
app.use("/metrics", metricsRoutes);
app.use("/webhooks", webhooksRoutes); // 3. Use the webhook routes

// --- Default and Health-Check Routes ---
app.get("/", (req, res) => {
  res.send("🚀 Xeno FDE Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running 🚀" });
});

// Example test route to get all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});