const db = require('../config/db');

// ─── GET ALL CLASSROOMS ───
exports.getAll = async (req, res) => {
  try {
    const { room_type, min_capacity, building, available } = req.query;
    let query = 'SELECT * FROM classrooms WHERE 1=1';
    const params = [];

    if (room_type) { params.push(room_type); query += ` AND room_type = $${params.length}`; }
    if (min_capacity) { params.push(parseInt(min_capacity)); query += ` AND capacity >= $${params.length}`; }
    if (building) { params.push(building); query += ` AND building = $${params.length}`; }
    if (available !== undefined) { params.push(available === 'true'); query += ` AND is_available = $${params.length}`; }

    query += ' ORDER BY building, name';
    const result = await db.query(query, params);
    res.json({ classrooms: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms.' });
  }
};

// ─── GET ONE ───
exports.getById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM classrooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Classroom not found.' });
    res.json({ classroom: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classroom.' });
  }
};

// ─── CREATE ───
exports.create = async (req, res) => {
  try {
    const { name, building, floor, capacity, room_type, has_projector, has_ac, has_smartboard, has_computers } = req.body;
    const result = await db.query(
      `INSERT INTO classrooms (name, building, floor, capacity, room_type, has_projector, has_ac, has_smartboard, has_computers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, building, floor || 0, capacity, room_type || 'lecture', has_projector || false, has_ac || false, has_smartboard || false, has_computers || false]
    );
    res.status(201).json({ classroom: result.rows[0] });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ error: 'Failed to create classroom.' });
  }
};

// ─── UPDATE ───
exports.update = async (req, res) => {
  try {
    const { name, building, floor, capacity, room_type, has_projector, has_ac, has_smartboard, has_computers, is_available } = req.body;
    const result = await db.query(
      `UPDATE classrooms SET 
        name = COALESCE($1, name), building = COALESCE($2, building), floor = COALESCE($3, floor),
        capacity = COALESCE($4, capacity), room_type = COALESCE($5, room_type),
        has_projector = COALESCE($6, has_projector), has_ac = COALESCE($7, has_ac),
        has_smartboard = COALESCE($8, has_smartboard), has_computers = COALESCE($9, has_computers),
        is_available = COALESCE($10, is_available)
       WHERE id = $11 RETURNING *`,
      [name, building, floor, capacity, room_type, has_projector, has_ac, has_smartboard, has_computers, is_available, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Classroom not found.' });
    res.json({ classroom: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update classroom.' });
  }
};

// ─── DELETE ───
exports.remove = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM classrooms WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Classroom not found.' });
    res.json({ message: 'Classroom deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete classroom.' });
  }
};
