const db = require('../config/db');

const Task = {
    // Create new task
    create: async (taskData) => {
        const { user_id, title, description, status, priority, due_date } = taskData;
        const [result] = await db.execute(
            'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, title, description, status || 'Pending', priority || 'Medium', due_date]
        );
        return result.insertId;
    },

    // Get all tasks for a user
    findAllByUserId: async (userId) => {
        const [rows] = await db.execute(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    // Get task by ID
    findById: async (id, userId) => {
        const [rows] = await db.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    },

    // Update task
    update: async (id, userId, updateData) => {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (['title', 'description', 'status', 'priority', 'due_date'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.push(id, userId);
        const [result] = await db.execute(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        return result.affectedRows;
    },

    // Delete task
    delete: async (id, userId) => {
        const [result] = await db.execute(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows;
    }
};

module.exports = Task;
