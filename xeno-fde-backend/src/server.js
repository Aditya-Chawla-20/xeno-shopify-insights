import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Route imports
import tenantRoutes from "./routes/tenantRoutes.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js"; // 1. Import metrics routes

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware (must come before routes)
app.use(cors());
app.use(express.json());

// API Routes
app.use("/tenant", tenantRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/sync", syncRoutes);
app.use("/metrics", metricsRoutes); // 2. Use metrics routes

// Default and health-check routes
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});