const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
    // Create new user
    create: async (userData) => {
        const { name, email, password } = userData;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        return result.insertId;
    },

    // Find user by email
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // Find user by ID
    findById: async (id) => {
        const [rows] = await db.execute('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    // Check if password matches
    comparePassword: async (enteredPassword, hashedPassword) => {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    }
};

module.exports = User;
