const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from the header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from DB (excluding password)
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user no longer exists'
                });
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);

            let message = 'Not authorized, token failed';
            if (error.name === 'TokenExpiredError') {
                message = 'Not authorized, token expired';
            } else if (error.name === 'JsonWebTokenError') {
                message = 'Not authorized, invalid token';
            }

            return res.status(401).json({
                success: false,
                message: message
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

module.exports = { protect };
