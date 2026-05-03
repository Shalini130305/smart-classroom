const db = require('../config/db');

// ─── GET TIMETABLE ───
exports.getTimetable = async (req, res) => {
  try {
    const { semester, section, academic_year, faculty_id } = req.query;
    let query = `
      SELECT te.*, c.name as course_name, c.code as course_code, c.course_type,
             cr.name as classroom_name, cr.building,
             ts.day_of_week, ts.start_time, ts.end_time, ts.slot_number,
             u.first_name as faculty_first_name, u.last_name as faculty_last_name
      FROM timetable_entries te
      JOIN courses c ON te.course_id = c.id
      JOIN classrooms cr ON te.classroom_id = cr.id
      JOIN time_slots ts ON te.time_slot_id = ts.id
      JOIN faculty_profiles fp ON te.faculty_id = fp.id
      JOIN users u ON fp.user_id = u.id
      WHERE te.is_active = true`;

    const params = [];
    if (semester) { params.push(parseInt(semester)); query += ` AND te.semester = $${params.length}`; }
    if (section) { params.push(section); query += ` AND te.section = $${params.length}`; }
    if (academic_year) { params.push(academic_year); query += ` AND te.academic_year = $${params.length}`; }
    if (faculty_id) { params.push(faculty_id); query += ` AND te.faculty_id = $${params.length}`; }

    query += ' ORDER BY ts.day_of_week, ts.slot_number';
    const result = await db.query(query, params);
    res.json({ timetable: result.rows });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable.' });
  }
};

// ─── CREATE ENTRY ───
exports.createEntry = async (req, res) => {
  try {
    const { course_id, faculty_id, classroom_id, time_slot_id, section, semester, academic_year } = req.body;

    // faculty_id from frontend is actually user_id. We need to find the faculty_profiles.id
    const fpQuery = await db.query('SELECT id FROM faculty_profiles WHERE user_id = $1', [faculty_id]);
    let realFacultyId = fpQuery.rows[0]?.id;
    
    // If somehow a faculty profile doesn't exist for this user, create one automatically
    if (!realFacultyId) {
      const newFp = await db.query('INSERT INTO faculty_profiles (user_id) VALUES ($1) RETURNING id', [faculty_id]);
      realFacultyId = newFp.rows[0].id;
    }

    // Check conflicts
    const conflicts = await checkConflicts(realFacultyId, classroom_id, time_slot_id, academic_year);
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Schedule conflict detected.', conflicts });
    }

    const result = await db.query(
      `INSERT INTO timetable_entries (course_id, faculty_id, classroom_id, time_slot_id, section, semester, academic_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [course_id, realFacultyId, classroom_id, time_slot_id, section, semester, academic_year]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (error) {
    console.error('Create timetable error:', error);
    if (error.code === '23505') return res.status(409).json({ error: 'Schedule conflict: slot already occupied.' });
    res.status(500).json({ error: 'Failed to create timetable entry.' });
  }
};

// ─── UPDATE ENTRY ───
exports.updateEntry = async (req, res) => {
  try {
    const { course_id, faculty_id, classroom_id, time_slot_id, section, semester, is_active } = req.body;
    const result = await db.query(
      `UPDATE timetable_entries SET
        course_id = COALESCE($1, course_id), faculty_id = COALESCE($2, faculty_id),
        classroom_id = COALESCE($3, classroom_id), time_slot_id = COALESCE($4, time_slot_id),
        section = COALESCE($5, section), semester = COALESCE($6, semester),
        is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [course_id, faculty_id, classroom_id, time_slot_id, section, semester, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ entry: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry.' });
  }
};

// ─── DELETE ENTRY ───
exports.deleteEntry = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM timetable_entries WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Entry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
};

// ─── GET TIME SLOTS ───
exports.getTimeSlots = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM time_slots ORDER BY day_of_week, slot_number');
    res.json({ time_slots: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time slots.' });
  }
};

// ─── CONFLICT CHECK HELPER ───
async function checkConflicts(faculty_id, classroom_id, time_slot_id, academic_year) {
  const conflicts = [];

  const facultyConflict = await db.query(
    `SELECT te.*, c.name as course_name FROM timetable_entries te
     JOIN courses c ON te.course_id = c.id
     WHERE te.faculty_id = $1 AND te.time_slot_id = $2 AND te.academic_year = $3 AND te.is_active = true`,
    [faculty_id, time_slot_id, academic_year]
  );
  if (facultyConflict.rows.length > 0) {
    conflicts.push({ type: 'faculty', message: 'Faculty already assigned in this slot', details: facultyConflict.rows[0] });
  }

  const roomConflict = await db.query(
    `SELECT te.*, c.name as course_name FROM timetable_entries te
     JOIN courses c ON te.course_id = c.id
     WHERE te.classroom_id = $1 AND te.time_slot_id = $2 AND te.academic_year = $3 AND te.is_active = true`,
    [classroom_id, time_slot_id, academic_year]
  );
  if (roomConflict.rows.length > 0) {
    conflicts.push({ type: 'classroom', message: 'Classroom already booked in this slot', details: roomConflict.rows[0] });
  }

  return conflicts;
}
