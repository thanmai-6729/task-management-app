const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../utils/validation');

// @route   POST /api/auth/register
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
router.post('/login', validateLogin, login);

// @route   GET /api/auth/profile
router.get('/profile', protect, getProfile);

module.exports = router;
