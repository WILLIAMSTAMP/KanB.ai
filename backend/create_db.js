const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  // Retrieve configuration from environment variables
  const DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const DB_PORT = process.env.DB_PORT || 3306;
  const DB_USERNAME = process.env.DB_USERNAME || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.DB_NAME || 'kanban_ai';

  try {
    // Connect without specifying a database
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USERNAME,
      password: DB_PASSWORD,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Database "${DB_NAME}" has been created or already exists.`);

    // Optionally, switch to the database and create tables
    // await connection.query(`USE \`${DB_NAME}\`;`);
    // Example: Create a sample table
    // const createTableQuery = `
    //   CREATE TABLE IF NOT EXISTS tasks (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     title VARCHAR(255) NOT NULL,
    //     description TEXT,
    //     status VARCHAR(50) DEFAULT 'todo',
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `;
    // await connection.query(createTableQuery);
    // console.log('Sample table "tasks" created.');

    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();