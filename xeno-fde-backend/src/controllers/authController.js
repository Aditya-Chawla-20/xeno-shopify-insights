// src/controllers/authController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    // For this assignment, we'll have a user register under an existing tenant.
    const { name, email, password, tenantId } = req.body;
    if (!name || !email || !password || !tenantId) {
        return res.status(400).json({ error: "Name, email, password, and tenantId are required." });
    }

    try {
        // Check if the tenant exists
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found." });
        }

        // Check if a user with this email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                tenantId: tenant.id, // Link the new user to the tenant
            },
        });

        res.status(201).json({ message: "User created successfully.", userId: newUser.id });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error during registration." });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Create a JWT with user and tenant info
        const token = jwt.sign(
            { userId: user.id, email: user.email, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: "Login successful!",
            token,
            user: { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login." });
    }
};