require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    const adminRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['admin@smartclass.edu', adminHash, 'admin', 'System', 'Admin', '9999999999']
    );

    // Create faculty users
    const facultyHash = await bcrypt.hash('faculty123', 12);
    const facultyData = [
      ['dr.kumar@smartclass.edu', 'Rajesh', 'Kumar', '9876543210', 'Professor', 'Data Structures, Algorithms'],
      ['dr.priya@smartclass.edu', 'Priya', 'Sharma', '9876543211', 'Associate Professor', 'Database Systems, SQL'],
      ['prof.anand@smartclass.edu', 'Anand', 'Verma', '9876543212', 'Assistant Professor', 'Machine Learning, AI'],
      ['dr.meena@smartclass.edu', 'Meena', 'Iyer', '9876543213', 'Professor', 'Operating Systems, Networks'],
    ];

    // Create departments
    const deptData = [
      ['Computer Science & Engineering', 'CSE'],
      ['Electronics & Communication', 'ECE'],
      ['Information Technology', 'IT'],
      ['Mechanical Engineering', 'ME'],
    ];

    const deptIds = [];
    for (const [name, code] of deptData) {
      const res = await client.query(
        `INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING id`,
        [name, code]
      );
      deptIds.push(res.rows[0].id);
    }

    const facultyUserIds = [];
    const facultyProfileIds = [];
    for (let i = 0; i < facultyData.length; i++) {
      const [email, first, last, phone, desig, spec] = facultyData[i];
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES ($1, $2, 'faculty', $3, $4, $5) RETURNING id`,
        [email, facultyHash, first, last, phone]
      );
      facultyUserIds.push(userRes.rows[0].id);

      const profRes = await client.query(
        `INSERT INTO faculty_profiles (user_id, department_id, designation, specialization)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [userRes.rows[0].id, deptIds[i % deptIds.length], desig, spec]
      );
      facultyProfileIds.push(profRes.rows[0].id);
    }

    // Update department heads
    await client.query(`UPDATE departments SET head_faculty_id = $1 WHERE code = 'CSE'`, [facultyUserIds[0]]);

    // Create courses
    const courseData = [
      ['Data Structures & Algorithms', 'CS201', deptIds[0], 4, 3, 'theory'],
      ['Database Management Systems', 'CS301', deptIds[0], 3, 4, 'theory'],
      ['Machine Learning', 'CS401', deptIds[0], 4, 3, 'theory'],
      ['Operating Systems', 'CS302', deptIds[0], 3, 4, 'theory'],
      ['Computer Networks', 'CS303', deptIds[0], 3, 3, 'theory'],
      ['DBMS Lab', 'CS301L', deptIds[0], 3, 2, 'lab'],
      ['ML Lab', 'CS401L', deptIds[0], 4, 2, 'lab'],
      ['Digital Electronics', 'EC201', deptIds[1], 3, 4, 'theory'],
    ];

    const courseIds = [];
    for (const [name, code, deptId, sem, credits, type] of courseData) {
      const res = await client.query(
        `INSERT INTO courses (name, code, department_id, semester, credits, course_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [name, code, deptId, sem, credits, type]
      );
      courseIds.push(res.rows[0].id);
    }

    // Map faculty to courses
    for (let i = 0; i < Math.min(facultyProfileIds.length, courseIds.length); i++) {
      await client.query(
        `INSERT INTO faculty_courses (faculty_id, course_id, academic_year) VALUES ($1, $2, '2025-26')`,
        [facultyProfileIds[i % facultyProfileIds.length], courseIds[i]]
      );
    }

    // Create classrooms
    const classroomData = [
      ['LH-101', 'Main Block', 1, 60, 'lecture', true, true, true, false],
      ['LH-102', 'Main Block', 1, 60, 'lecture', true, false, false, false],
      ['LH-201', 'Main Block', 2, 90, 'lecture', true, true, true, false],
      ['LH-301', 'Main Block', 3, 120, 'lecture', true, true, true, false],
      ['LAB-101', 'CS Block', 1, 40, 'lab', true, true, true, true],
      ['LAB-102', 'CS Block', 1, 40, 'lab', true, true, false, true],
      ['SH-101', 'Seminar Block', 1, 30, 'seminar', true, true, true, false],
      ['AUDI-01', 'Admin Block', 0, 500, 'auditorium', true, true, true, false],
    ];

    for (const [name, building, floor, cap, type, proj, ac, smart, comp] of classroomData) {
      await client.query(
        `INSERT INTO classrooms (name, building, floor, capacity, room_type, has_projector, has_ac, has_smartboard, has_computers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [name, building, floor, cap, type, proj, ac, smart, comp]
      );
    }

    // Create student users
    const studentHash = await bcrypt.hash('student123', 12);
    const studentNames = [
      ['Aarav', 'Patel'], ['Diya', 'Singh'], ['Vihaan', 'Reddy'],
      ['Ananya', 'Gupta'], ['Arjun', 'Nair'], ['Ishaan', 'Das'],
      ['Kavya', 'Joshi'], ['Rohan', 'Mehta'], ['Sneha', 'Bhat'], ['Tanvi', 'Rao'],
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const [first, last] = studentNames[i];
      const email = `${first.toLowerCase()}.${last.toLowerCase()}@smartclass.edu`;
      const enrollNum = `2023CSE${String(i + 1).padStart(3, '0')}`;

      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'student', $3, $4) RETURNING id`,
        [email, studentHash, first, last]
      );

      const studentRes = await client.query(
        `INSERT INTO student_profiles (user_id, department_id, enrollment_number, semester, section, batch_year)
         VALUES ($1, $2, $3, $4, $5, 2023) RETURNING id`,
        [userRes.rows[0].id, deptIds[0], enrollNum, i < 5 ? 3 : 5, i < 5 ? 'A' : 'B']
      );

      // Enroll in courses
      const coursesToEnroll = i < 5 ? [courseIds[1], courseIds[3], courseIds[4]] : [courseIds[0], courseIds[2]];
      for (const cid of coursesToEnroll) {
        await client.query(
          `INSERT INTO student_courses (student_id, course_id, academic_year) VALUES ($1, $2, '2025-26')`,
          [studentRes.rows[0].id, cid]
        );
      }
    }

    // Add sample notifications
    const notifRes = await client.query(`SELECT id FROM users LIMIT 5`);
    for (const row of notifRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
        [row.id, 'Welcome to Smart Classroom!', 'Your account has been set up successfully. Explore the dashboard to get started.', 'success']
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:   admin@smartclass.edu / admin123');
    console.log('   Faculty: dr.kumar@smartclass.edu / faculty123');
    console.log('   Student: aarav.patel@smartclass.edu / student123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seedDatabase();
