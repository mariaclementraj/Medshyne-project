const express = require('express');
const router = express.Router();
const db = require('../config/db');
const dbs=require('../config/dbs')

// Helper validation functions
const isValidPincode = (pincode) => /^\d{6}$/.test(pincode);
const isValidMobile = (mobile) => /^\d{10}$/.test(mobile);

// Register Student
router.post('/student-register', async (req, res) => {
    const { 
        upload_photo, name, address, gender, state, pincode, class: className, 
        division, date_of_birth, blood_group, department, allergies, any_disease, 
        allergies_define, any_disease_define, current_health_report, past_health_report 
    } = req.body;

    // Check required fields
    const requiredFields = [name, address, state, pincode, className, division, 
                            date_of_birth, department];
    if (requiredFields.some(field => !field)) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!isValidPincode(pincode)) {
        return res.status(400).json({ success: false, message: 'Invalid pincode format' });
    }

    const query = `INSERT INTO students (
        upload_photo, name, address, gender, state, pincode, class, 
        division, date_of_birth, blood_group, department, allergies, any_disease, 
        allergies_define, any_disease_define, current_health_report, past_health_report
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        upload_photo, name, address, gender, state, pincode, className, 
        division, date_of_birth, blood_group, department, allergies, any_disease, 
        allergies_define, any_disease_define, current_health_report, past_health_report
    ];

    db.query(query, values, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.status(201).json({ Success: true, Message: 'Student Registered Successfully' });
    });
});

// Register Parent
router.post('/parent-register', async (req, res) => {
    const { name, relation, mobile, student_id_no } = req.body;

    // Check required fields
    if (!name || !relation || !mobile || !student_id_no) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!isValidMobile(mobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }

    // Check if student_id_no exists in students table
    const checkStudentQuery = 'SELECT id_no FROM students WHERE id_no = ?';
    db.query(checkStudentQuery, [student_id_no], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Student ID does not exist' });
        }

        const query = `INSERT INTO parents (
            name, relation, mobile, student_id_no
        ) VALUES (?, ?, ?, ?)`;
        const values = [name, relation, mobile, student_id_no];

        db.query(query, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            res.status(201).json({ Success: true, Message: 'Parent Registered Successfully' });
        });
    });
});

// Get Student and Parent Data
router.get('/students-parents', (req, res) => {
    const query = `
        SELECT 
            s.id_no AS student_id,
            s.name AS student_name,
            s.address,
            s.gender,
            s.state,
            s.pincode,
            s.class,
            s.division,
            s.date_of_birth,
            s.blood_group,
            s.department,
            s.allergies,
            s.any_disease,
            s.allergies_define,
            s.any_disease_define,
            s.current_health_report,
            s.past_health_report,
            p.id AS parent_id,
            p.name AS parent_name,
            p.relation,
            p.mobile
        FROM students s
        INNER JOIN parents p ON s.id_no = p.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Result: false, message: 'Server error' });
        }
        res.status(200).json({ Result: 'Success', Data: results });
    });
});


// Register Student and Parent
router.post('/register-student-parent', async (req, res) => {
    const {
        student: {
            upload_photo, name, address, gender, state, pincode, class: className, 
            division, date_of_birth, blood_group, department, allergies, any_disease, 
            allergies_define, any_disease_define, current_health_report, past_health_report
        },
        parent: {
            name: parentName, relation, mobile
        }
    } = req.body;

    // Check required fields
    const requiredStudentFields = [name, address, state, pincode, className, division, date_of_birth, department];
    const requiredParentFields = [parentName, relation, mobile];
    
    if (requiredStudentFields.some(field => !field) || requiredParentFields.some(field => !field)) {
        return res.status(400).json({ Result: "Failure", Message: "All fields are required" });
    }

    if (!isValidMobile(mobile)) {
        return res.status(400).json({ Result: "Failure", Message: "Invalid mobile number format" });
    }

    if (!isValidPincode(pincode)) {
        return res.status(400).json({ Result: "Failure", Message: "Invalid pincode format" });
    }

    const connection = await dbs.getConnection();

    try {
        await connection.beginTransaction();

        const [studentResult] = await connection.query(
            `INSERT INTO students (
                upload_photo, name, address, gender, state, pincode, class, 
                division, date_of_birth, blood_group, department, allergies, any_disease, 
                allergies_define, any_disease_define, current_health_report, past_health_report
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [upload_photo, name, address, gender, state, pincode, className, division, date_of_birth, blood_group, department, allergies, any_disease, allergies_define, any_disease_define, current_health_report, past_health_report]
        );

        const studentId = studentResult.insertId;

        await connection.query(
            `INSERT INTO parents (name, relation, mobile, student_id_no) VALUES (?, ?, ?, ?)`, 
            [parentName, relation, mobile, studentId]
        );

        await connection.commit();

        res.status(201).json({ Result: "Success", Message: "Student and Parent Registered Successfully" });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ Result: "Failure", Message: "Server error" });
    } finally {
        connection.release();
    }
});


module.exports = router;

