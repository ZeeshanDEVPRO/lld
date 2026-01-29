import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // Create database first
    const dbName = process.env.DB_NAME || 'flytbase';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);
    
    // Switch to the database
    await connection.query(`USE \`${dbName}\``);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split by semicolons
    const lines = schema.split('\n');
    let currentStatement = '';
    const statements = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment lines
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }
      
      currentStatement += ' ' + trimmed;
      
      // If line ends with semicolon, we have a complete statement
      if (trimmed.endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          // Remove trailing semicolon and filter out CREATE DATABASE and USE
          const cleanStatement = statement.slice(0, -1).trim();
          const upper = cleanStatement.toUpperCase();
          if (!upper.startsWith('CREATE DATABASE') && !upper.startsWith('USE ')) {
            statements.push(cleanStatement);
          }
        }
        currentStatement = '';
      }
    }

    // Execute all statements
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await connection.query(statement + ';');
        } catch (error) {
          // Ignore errors for duplicate entries or existing objects
          if (!error.message.includes('Duplicate') && 
              !error.message.includes('already exists') &&
              !error.message.includes('Unknown database')) {
            console.warn(`Warning: ${error.message.substring(0, 150)}`);
          }
        }
      }
    }

    console.log('Database setup completed successfully!');
    console.log('Default admin user: admin@flytbase.com / admin123');
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. MySQL is installed and running');
    console.error('2. MySQL credentials in .env are correct');
    console.error('3. MySQL user has CREATE DATABASE privileges');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

