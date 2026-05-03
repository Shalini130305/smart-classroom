const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, phone } = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name`,
      [email, password_hash, role, first_name, last_name, phone || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query(
      'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    let profile = { ...req.user };

    if (role === 'faculty') {
      const fp = await db.query(
        `SELECT fp.*, d.name as department_name, d.code as department_code
         FROM faculty_profiles fp
         LEFT JOIN departments d ON fp.department_id = d.id
         WHERE fp.user_id = $1`, [id]
      );
      if (fp.rows.length > 0) profile.faculty_profile = fp.rows[0];
    } else if (role === 'student') {
      const sp = await db.query(
        `SELECT sp.*, d.name as department_name, d.code as department_code
         FROM student_profiles sp
         LEFT JOIN departments d ON sp.department_id = d.id
         WHERE sp.user_id = $1`, [id]
      );
      if (sp.rows.length > 0) profile.student_profile = sp.rows[0];
    }

    res.json({ user: profile });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const result = await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), 
       phone = COALESCE($3, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $4
       RETURNING id, email, role, first_name, last_name, phone`,
      [first_name, last_name, phone, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};
