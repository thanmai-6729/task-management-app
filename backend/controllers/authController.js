const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Generate JWT token
 * @param   {number} id - User ID
 * @returns {string} - JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findByEmail(email);
        if (userExists) {
            res.status(400);
            return next(new Error('User already exists with this email'));
        }

        // Create user
        const userId = await User.create({ name, email, password });

        if (userId) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    id: userId,
                    name,
                    email,
                    token: generateToken(userId),
                }
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data received');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);

        if (user && (await User.comparePassword(password, user.password))) {
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    token: generateToken(user.id),
                }
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
    try {
        // req.user is attached by the authMiddleware
        if (!req.user) {
            res.status(404);
            throw new Error('User not found');
        }

        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
};
