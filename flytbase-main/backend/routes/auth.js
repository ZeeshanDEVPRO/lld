import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role = 'operator' } = req.body;

      // Check if user exists
      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password_hash: passwordHash,
        name,
        role
      });

      const token = jwt.sign(
        { id: user._id.toString(), email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Emergency Mode: Allow login if DB is unreachable or user is missing (for demo purposes)
      const isDemoAdmin = email === 'admin@flytbase.com' && password === 'admin123';

      let user;
      try {
        user = await User.findOne({ email });
      } catch (dbError) {
        console.warn('⚠️ Database unreachable. Checking for emergency bypass...');
        if (isDemoAdmin) {
          console.log('🚀 Emergency Bypass Activated for admin@flytbase.com');
          const token = jwt.sign(
            { id: '000000000000000000000001', email: 'admin@flytbase.com', role: 'admin' },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '7d' }
          );
          return res.json({
            token,
            user: { id: '000000000000000000000001', email: 'admin@flytbase.com', name: 'Admin (Mock)', role: 'admin' }
          });
        }
        return res.status(503).json({ error: 'Database service unavailable. Please check your network/Atlas whitelist.' });
      }

      if (!user) {
        // Even if DB is up, if user is missing, allow the first admin for demo
        if (isDemoAdmin) {
          const token = jwt.sign(
            { id: '000000000000000000000001', email: 'admin@flytbase.com', role: 'admin' },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '7d' }
          );
          return res.json({
            token,
            user: { id: '000000000000000000000001', email: 'admin@flytbase.com', name: 'Admin (Mock)', role: 'admin' }
          });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failure. Internal Server Error.' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // Check for mock admin
    if (decoded.id === '000000000000000000000001') {
      return res.json({
        user: { id: '000000000000000000000001', email: 'admin@flytbase.com', name: 'Admin (Mock)', role: 'admin' }
      });
    }

    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
