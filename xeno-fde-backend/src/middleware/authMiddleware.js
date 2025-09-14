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
        
        // CONSISTENCY FIX: Attach the decoded token payload as req.user
        req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({ error: "Not authorized, token failed." });
    }
};