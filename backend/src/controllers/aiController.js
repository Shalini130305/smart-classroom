const db = require('../config/db');

/**
 * AI Timetable Generator using Greedy + Constraint Satisfaction
 * Generates conflict-free timetable entries for a given semester/year
 */
exports.generateTimetable = async (req, res) => {
  try {
    const { semester, section, academic_year } = req.body;
    if (!semester || !academic_year) {
      return res.status(400).json({ error: 'semester and academic_year are required.' });
    }

    // Get available faculty-course mappings for this semester
    const fcResult = await db.query(`
      SELECT fc.id, fc.faculty_id, fc.course_id, c.name as course_name, c.course_type,
             c.credits, fp.max_hours_per_week
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN faculty_profiles fp ON fc.faculty_id = fp.id
      WHERE c.semester = $1 AND fc.academic_year = $2
    `, [semester, academic_year]);

    const facultyCourses = fcResult.rows;
    if (facultyCourses.length === 0) {
      return res.status(400).json({ error: 'No faculty-course mappings found for this semester.' });
    }

    // Get time slots
    const tsResult = await db.query('SELECT * FROM time_slots ORDER BY day_of_week, slot_number');
    const timeSlots = tsResult.rows;

    // Get available classrooms
    const crResult = await db.query('SELECT * FROM classrooms WHERE is_available = true ORDER BY capacity');
    const classrooms = crResult.rows;

    // Clear existing entries for this semester/section/year
    await db.query(
      'DELETE FROM timetable_entries WHERE semester = $1 AND section = $2 AND academic_year = $3',
      [semester, section || 'A', academic_year]
    );

    // Track occupied slots
    const facultySlots = {};  // faculty_id -> Set of time_slot_ids
    const roomSlots = {};     // classroom_id -> Set of time_slot_ids

    const entries = [];
    const conflicts = [];
    let slotIndex = 0;

    // Assign slots per course based on credits
    for (const fc of facultyCourses) {
      const slotsNeeded = fc.credits;
      let assigned = 0;

      // Pick appropriate classroom
      const isLab = fc.course_type === 'lab';
      const suitableRooms = classrooms.filter(r =>
        isLab ? r.room_type === 'lab' : r.room_type !== 'lab'
      );

      for (let i = 0; i < timeSlots.length && assigned < slotsNeeded; i++) {
        const tsIdx = (slotIndex + i) % timeSlots.length;
        const ts = timeSlots[tsIdx];

        // Check faculty availability
        if (!facultySlots[fc.faculty_id]) facultySlots[fc.faculty_id] = new Set();
        if (facultySlots[fc.faculty_id].has(ts.id)) continue;

        // Find an available room
        let assignedRoom = null;
        for (const room of suitableRooms) {
          if (!roomSlots[room.id]) roomSlots[room.id] = new Set();
          if (!roomSlots[room.id].has(ts.id)) {
            assignedRoom = room;
            break;
          }
        }

        if (!assignedRoom) {
          conflicts.push({ course: fc.course_name, slot: `Day ${ts.day_of_week} Slot ${ts.slot_number}`, reason: 'No available room' });
          continue;
        }

        // Assign
        try {
          const result = await db.query(
            `INSERT INTO timetable_entries (course_id, faculty_id, classroom_id, time_slot_id, section, semester, academic_year)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [fc.course_id, fc.faculty_id, assignedRoom.id, ts.id, section || 'A', semester, academic_year]
          );
          entries.push(result.rows[0]);
          facultySlots[fc.faculty_id].add(ts.id);
          roomSlots[assignedRoom.id].add(ts.id);
          assigned++;
        } catch (err) {
          conflicts.push({ course: fc.course_name, reason: err.message });
        }
      }

      slotIndex += slotsNeeded + 1; // Spread out courses

      if (assigned < slotsNeeded) {
        conflicts.push({ course: fc.course_name, reason: `Only ${assigned}/${slotsNeeded} slots assigned` });
      }
    }

    // Log the generation
    await db.query(
      'INSERT INTO ai_schedule_logs (action, details, conflicts_found, resolved, generated_by) VALUES ($1,$2,$3,$4,$5)',
      ['auto_generate', JSON.stringify({ semester, section, academic_year, entries: entries.length }), conflicts.length, conflicts.length === 0, req.user.id]
    );

    res.json({
      message: `Generated ${entries.length} timetable entries.`,
      entries_created: entries.length,
      conflicts,
      conflict_count: conflicts.length,
    });
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({ error: 'Timetable generation failed.' });
  }
};

/**
 * Detect scheduling conflicts
 */
exports.detectConflicts = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const year = academic_year || '2025-26';

    // Faculty double-booking
    const facultyConflicts = await db.query(`
      SELECT t1.id as entry1, t2.id as entry2, u.first_name, u.last_name,
             c1.name as course1, c2.name as course2, ts.day_of_week, ts.start_time
      FROM timetable_entries t1
      JOIN timetable_entries t2 ON t1.faculty_id = t2.faculty_id AND t1.time_slot_id = t2.time_slot_id AND t1.id < t2.id
      JOIN faculty_profiles fp ON t1.faculty_id = fp.id
      JOIN users u ON fp.user_id = u.id
      JOIN courses c1 ON t1.course_id = c1.id
      JOIN courses c2 ON t2.course_id = c2.id
      JOIN time_slots ts ON t1.time_slot_id = ts.id
      WHERE t1.academic_year = $1 AND t1.is_active = true AND t2.is_active = true
    `, [year]);

    // Room double-booking
    const roomConflicts = await db.query(`
      SELECT t1.id as entry1, t2.id as entry2, cr.name as room,
             c1.name as course1, c2.name as course2, ts.day_of_week, ts.start_time
      FROM timetable_entries t1
      JOIN timetable_entries t2 ON t1.classroom_id = t2.classroom_id AND t1.time_slot_id = t2.time_slot_id AND t1.id < t2.id
      JOIN classrooms cr ON t1.classroom_id = cr.id
      JOIN courses c1 ON t1.course_id = c1.id
      JOIN courses c2 ON t2.course_id = c2.id
      JOIN time_slots ts ON t1.time_slot_id = ts.id
      WHERE t1.academic_year = $1 AND t1.is_active = true AND t2.is_active = true
    `, [year]);

    res.json({
      faculty_conflicts: facultyConflicts.rows,
      room_conflicts: roomConflicts.rows,
      total_conflicts: facultyConflicts.rows.length + roomConflicts.rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Conflict detection failed.' });
  }
};

/**
 * Smart classroom recommendation
 */
exports.recommendClassroom = async (req, res) => {
  try {
    const { course_type, min_capacity, time_slot_id, academic_year, needs_projector, needs_ac, needs_computers } = req.query;
    const year = academic_year || '2025-26';

    let query = `
      SELECT c.* FROM classrooms c
      WHERE c.is_available = true`;
    const params = [];

    if (course_type === 'lab') { query += ` AND c.room_type = 'lab'`; }
    else { query += ` AND c.room_type != 'lab'`; }

    if (min_capacity) { params.push(parseInt(min_capacity)); query += ` AND c.capacity >= $${params.length}`; }
    if (needs_projector === 'true') query += ' AND c.has_projector = true';
    if (needs_ac === 'true') query += ' AND c.has_ac = true';
    if (needs_computers === 'true') query += ' AND c.has_computers = true';

    // Exclude rooms already booked for this slot
    if (time_slot_id) {
      params.push(time_slot_id); params.push(year);
      query += ` AND c.id NOT IN (SELECT classroom_id FROM timetable_entries WHERE time_slot_id = $${params.length - 1} AND academic_year = $${params.length} AND is_active = true)`;
    }

    query += ' ORDER BY c.capacity ASC';
    const result = await db.query(query, params);

    // Score rooms
    const scored = result.rows.map(room => {
      let score = 50;
      if (room.has_smartboard) score += 15;
      if (room.has_ac) score += 10;
      if (room.has_projector) score += 10;
      if (room.has_computers && course_type === 'lab') score += 15;
      return { ...room, ai_score: score };
    }).sort((a, b) => b.ai_score - a.ai_score);

    res.json({ recommendations: scored });
  } catch (error) {
    res.status(500).json({ error: 'Recommendation failed.' });
  }
};

/**
 * AI Chatbot - answers questions about schedules
 */
exports.chatbot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const lower = message.toLowerCase();
    let response = '';
    let intent = 'general';

    if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('class')) {
      intent = 'schedule_query';
      const entries = await db.query(`
        SELECT c.name, cr.name as room, ts.day_of_week, ts.start_time, ts.end_time
        FROM timetable_entries te
        JOIN courses c ON te.course_id = c.id
        JOIN classrooms cr ON te.classroom_id = cr.id
        JOIN time_slots ts ON te.time_slot_id = ts.id
        WHERE te.is_active = true ORDER BY ts.day_of_week, ts.slot_number LIMIT 10`);
      const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (entries.rows.length > 0) {
        response = 'Here are upcoming classes:\n' + entries.rows.map(e =>
          `• ${e.name} - ${days[e.day_of_week]} ${e.start_time}-${e.end_time} in ${e.room}`
        ).join('\n');
      } else {
        response = 'No timetable entries found. The admin may need to generate the timetable first.';
      }
    } else if (lower.includes('attendance')) {
      intent = 'attendance_query';
      response = 'To check your attendance, visit the Attendance section in your dashboard. Faculty can mark attendance from their dashboard.';
    } else if (lower.includes('classroom') || lower.includes('room') || lower.includes('lab')) {
      intent = 'classroom_query';
      const rooms = await db.query('SELECT name, building, capacity, room_type FROM classrooms WHERE is_available = true ORDER BY name');
      response = 'Available classrooms:\n' + rooms.rows.map(r => `• ${r.name} (${r.building}) - ${r.room_type}, capacity: ${r.capacity}`).join('\n');
    } else if (lower.includes('help') || lower.includes('what can you do')) {
      intent = 'help';
      response = 'I can help you with:\n• Schedule/Timetable queries\n• Classroom availability\n• Attendance information\n• General navigation help\n\nTry asking: "Show me the timetable" or "Which classrooms are available?"';
    } else {
      response = 'I\'m the Smart Classroom AI assistant. I can help with timetables, classrooms, and attendance. Try asking about your schedule or available rooms!';
    }

    // Save conversation
    await db.query(
      'INSERT INTO chatbot_conversations (user_id, message, response, intent) VALUES ($1,$2,$3,$4)',
      [req.user.id, message, response, intent]
    );

    res.json({ response, intent });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Chatbot failed.', response: 'Sorry, I encountered an error. Please try again.' });
  }
};
