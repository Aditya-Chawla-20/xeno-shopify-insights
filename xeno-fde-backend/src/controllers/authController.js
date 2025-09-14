import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create a new Tenant for this user
        const newTenant = await prisma.tenant.create({
            data: {
                name: `${name}'s Company`,
            },
        });

        // Create the new User and link them to the new Tenant
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                tenantId: newTenant.id,
            },
        });
        
        // Create and return a token immediately for a seamless experience
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, tenantId: newTenant.id, name: newUser.name },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ 
            message: "User and Tenant created successfully.", 
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, tenantId: newTenant.id }
        });

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

        const token = jwt.sign(
            { userId: user.id, email: user.email, tenantId: user.tenantId, name: user.name },
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