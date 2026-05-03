const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    if (unread_only === 'true') query += ' AND is_read = false';
    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await db.query(query, params);
    const unread = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]);
    res.json({ notifications: result.rows, unread_count: parseInt(unread.rows[0].count) });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch notifications.' }); }
};

exports.markRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
};

exports.create = async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;
    const result = await db.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user_id, title, message, type || 'info', link || null]
    );
    res.status(201).json({ notification: result.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Failed to create.' }); }
};

exports.broadcast = async (req, res) => {
  try {
    const { title, message, type, role } = req.body;
    let q = 'SELECT id FROM users WHERE is_active = true';
    const p = [];
    if (role) { p.push(role); q += ` AND role = $${p.length}`; }
    const users = await db.query(q, p);
    for (const u of users.rows) {
      await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)', [u.id, title, message, type || 'info']);
    }
    res.status(201).json({ message: `Sent to ${users.rows.length} users.` });
  } catch (error) { res.status(500).json({ error: 'Failed to broadcast.' }); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
};
