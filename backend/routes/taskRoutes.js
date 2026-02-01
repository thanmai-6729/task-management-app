const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { validateTask } = require('../utils/validation');

// Protect all routes
router.use(protect);

// @route   GET /api/tasks/stats
router.get('/stats', getTaskStats);

// @route   GET /api/tasks
// @route   POST /api/tasks
router.route('/')
    .get(getTasks)
    .post(validateTask, createTask);

// @route   GET /api/tasks/:id
// @route   PUT /api/tasks/:id
// @route   DELETE /api/tasks/:id
router.route('/:id')
    .get(getTaskById)
    .put(validateTask, updateTask)
    .delete(deleteTask);

module.exports = router;
