const db = require('../config/db');

// ─── MARK ATTENDANCE ───
exports.markAttendance = async (req, res) => {
  try {
    const { records } = req.body; // Array of { student_id, timetable_entry_id, date, status, remarks }
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Attendance records are required.' });
    }

    const results = [];
    for (const record of records) {
      const { student_id, timetable_entry_id, date, status, remarks } = record;
      const result = await db.query(
        `INSERT INTO attendance (student_id, timetable_entry_id, date, status, marked_by, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, timetable_entry_id, date) 
         DO UPDATE SET status = $4, marked_by = $5, remarks = $6
         RETURNING *`,
        [student_id, timetable_entry_id, date, status, req.user.id, remarks || null]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Attendance marked successfully.', records: results });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

// ─── GET ATTENDANCE BY CLASS ───
exports.getByClass = async (req, res) => {
  try {
    const { timetable_entry_id, date } = req.query;
    let query = `
      SELECT a.*, sp.enrollment_number, u.first_name, u.last_name
      FROM attendance a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (timetable_entry_id) { params.push(timetable_entry_id); query += ` AND a.timetable_entry_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND a.date = $${params.length}`; }

    query += ' ORDER BY u.first_name, u.last_name';
    const result = await db.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
};

// ─── GET STUDENT ATTENDANCE SUMMARY ───
exports.getStudentSummary = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const result = await db.query(`
      SELECT c.name as course_name, c.code as course_code,
             COUNT(*) as total_classes,
             COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
             COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
             COUNT(*) FILTER (WHERE a.status = 'late') as late_count,
             ROUND(COUNT(*) FILTER (WHERE a.status = 'present')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as attendance_percentage
      FROM attendance a
      JOIN timetable_entries te ON a.timetable_entry_id = te.id
      JOIN courses c ON te.course_id = c.id
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE sp.user_id = $1
      GROUP BY c.id, c.name, c.code
      ORDER BY c.name
    `, [userId]);

    res.json({ summary: result.rows });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary.' });
  }
};

// ─── GET ATTENDANCE STATS (ADMIN) ───
exports.getStats = async (req, res) => {
  try {
    const overall = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'present') as total_present,
        COUNT(*) FILTER (WHERE status = 'absent') as total_absent,
        ROUND(COUNT(*) FILTER (WHERE status = 'present')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as overall_percentage
      FROM attendance
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const byDepartment = await db.query(`
      SELECT d.name as department, d.code,
             COUNT(*) as total,
             ROUND(COUNT(*) FILTER (WHERE a.status = 'present')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as percentage
      FROM attendance a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN departments d ON sp.department_id = d.id
      WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY d.id, d.name, d.code
    `);

    res.json({ overall: overall.rows[0], by_department: byDepartment.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance stats.' });
  }
};
