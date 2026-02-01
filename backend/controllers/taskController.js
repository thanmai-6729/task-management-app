const Task = require('../models/Task');
const db = require('../config/db');

/**
 * @desc    Get all tasks for authenticated user with filters
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, priority, search, sortBy, order, limit, offset } = req.query;

        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params = [userId];

        // Filtering
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Sorting
        const validSortFields = ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;

        // Pagination
        const pageSize = parseInt(limit) || 10;
        const pageOffset = parseInt(offset) || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(pageSize, pageOffset);

        const [tasks] = await db.execute(query, params);
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM tasks WHERE id = ?',
            [req.params.id]
        );

        const task = rows[0];

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        // Check ownership
        if (task.user_id !== req.user.id) {
            res.status(403);
            throw new Error('Not authorized to access this task');
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, due_date } = req.body;

        const [result] = await db.execute(
            'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, description, status || 'Pending', priority || 'Medium', due_date || null]
        );

        const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
    try {
        // Find task first to check ownership
        const [existingRows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        const task = existingRows[0];

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        if (task.user_id !== req.user.id) {
            res.status(403);
            throw new Error('Not authorized to update this task');
        }

        // Build dynamic query
        const fields = [];
        const values = [];
        const updateData = req.body;

        const allowedFields = ['title', 'description', 'status', 'priority', 'due_date'];
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (fields.length === 0) {
            res.status(400);
            throw new Error('No fields to update');
        }

        values.push(req.params.id);
        await db.execute(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        const [updatedRows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            data: updatedRows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
    try {
        // Find task first to check ownership
        const [existingRows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        const task = existingRows[0];

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        if (task.user_id !== req.user.id) {
            res.status(403);
            throw new Error('Not authorized to delete this task');
        }

        await db.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'Task removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority_count,
                SUM(CASE WHEN due_date < CURDATE() AND status != 'Completed' THEN 1 ELSE 0 END) as overdue_count
            FROM tasks 
            WHERE user_id = ?
        `, [userId]);

        res.status(200).json({
            success: true,
            data: {
                total_tasks: parseInt(stats[0].total_tasks) || 0,
                pending_count: parseInt(stats[0].pending_count) || 0,
                in_progress_count: parseInt(stats[0].in_progress_count) || 0,
                completed_count: parseInt(stats[0].completed_count) || 0,
                high_priority_count: parseInt(stats[0].high_priority_count) || 0,
                overdue_count: parseInt(stats[0].overdue_count) || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats
};
