// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Not authorized, no token." });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach tenant info to the request for other controllers to use
        req.tenant = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Not authorized, token failed." });
    }
};