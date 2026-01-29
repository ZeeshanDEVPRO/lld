import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function verifyUser() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'flytbase',
    });

    const [users] = await connection.query(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      ['admin@flytbase.com']
    );

    if (users.length === 0) {
      console.log('Admin user not found. Creating...');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['admin@flytbase.com', hash, 'Admin User', 'admin']
      );
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user exists');
      const user = users[0];
      const isValid = await bcrypt.compare('admin123', user.password_hash);
      if (isValid) {
        console.log('Password hash is correct!');
      } else {
        console.log('Password hash is incorrect. Updating...');
        const hash = await bcrypt.hash('admin123', 10);
        await connection.query(
          'UPDATE users SET password_hash = ? WHERE email = ?',
          [hash, 'admin@flytbase.com']
        );
        console.log('Password hash updated!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyUser();

