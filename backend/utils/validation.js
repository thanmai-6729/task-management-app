const { body, validationResult } = require('express-validator');

// Common error handler for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please include a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please include a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

const validateTask = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title cannot exceed 255 characters')
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape(),
    body('status')
        .optional()
        .isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status value'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority value'),
    body('due_date')
        .optional()
        .isISO8601().toDate().withMessage('Invalid date format for due_date'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateTask
};
