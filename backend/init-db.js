const pool = require('./config/db');

const initDb = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');

        // Split by semicolon to execute separate statements, but mysql2 pool can sometimes handle multiple statements if configured.
        // Or we can just use the connection to execute.
        const connection = await pool.getConnection();

        // Enable multiple statements for migration if needed, but safer to loop.
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

        for (let statement of statements) {
            await connection.query(statement);
        }

        console.log('✅ Database schema initialized successfully.');
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize database schema:', error.message);
        process.exit(1);
    }
};

initDb();
