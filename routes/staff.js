const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create
router.post('/staff-register', async (req, res) => {
    const { 
        upload_photo, name, id_no, new_pwd, con_pwd, address, gender, state, 
        pincode, class: className, division, date_of_birth, blood_group, department, 
        designation, allergies, any_disease, allergies_define, any_disease_define, 
        current_health_report, past_health_report, mobile, hcr 
    } = req.body;

    // Validate required fields
    if (!name || !id_no || !new_pwd || !con_pwd || !address || !state || !pincode ||
        !className || !division || !date_of_birth || !department || !designation || 
        !mobile) {
        return res.status(400).json({ Result: "Failure", Message: 'All fields are required' });
    }

    // Validate passwords
    if (new_pwd !== con_pwd) {
        return res.status(400).json({ Result: "Failure", Message: 'Passwords do not match' });
    }

    // Validation functions
    const isValidMobile = (mobile) => {
        const mobileRegex = /^\d{10}$/;
        return mobileRegex.test(mobile);
    };

    if (!isValidMobile(mobile)) {
        return res.status(400).json({ Result: "Failure", Message: 'Invalid mobile number format' });
    }

    const isValidPincode = (pincode) => {
        const pincodeRegex = /^\d{6}$/;
        return pincodeRegex.test(pincode);
    };

    if (!isValidPincode(pincode)) {
        return res.status(400).json({ Result: "Failure", Message: 'Invalid pincode format' });
    }

    // Prepare the query and values
    const query = `INSERT INTO staff (
            upload_photo, name, id_no, new_pwd, con_pwd, address, gender, state, pincode, class, division, date_of_birth, blood_group, department, designation, 
            allergies, any_disease, allergies_define, any_disease_define, current_health_report, past_health_report, mobile, hcr
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        upload_photo, name, id_no, new_pwd, con_pwd, address, gender, state, pincode, 
        className, division, date_of_birth, blood_group, department, designation, 
        allergies, any_disease, allergies_define, any_disease_define, 
        current_health_report, past_health_report, mobile, hcr
    ];

    // Execute the query
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error registering staff', err); // Log the error
            return res.status(500).json({ Result: "Failure", Message: 'Server error' });
        }
        res.status(201).json({ Result: "Success", Message: 'Staff Registered Successfully' });
    });
});


// Helper function to calculate age from date_of_birth
function calculateAge(dateOfBirth) {
    const diff = Date.now() - new Date(dateOfBirth).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// View staff and consult details based on id_no
router.get('/staff-and-consult-view/:id_no', (req, res) => {
    const idNo = req.params.id_no;

    // Combined query to get staff and consult details based on id_no
    const combinedQuery = `
        SELECT 
            s.upload_photo, 
            s.name, 
            s.id_no, 
            s.designation, 
            s.department, 
            s.gender, 
            s.date_of_birth, 
            CONCAT(s.class, ' ', s.division) AS Incharge_For, 
            s.blood_group, 
            s.address, 
            s.mobile, 
            s.allergies, 
            s.any_disease, 
            s.current_health_report, 
            s.past_health_report, 
            c.name AS consult_name, 
            c.consult_id, 
            c.doctor1, 
            CONCAT(c.class, ' / ', c.division) AS Division, 
            c.sick_type, 
            c.timing 
        FROM 
            staff s
        LEFT JOIN 
            consult c ON s.id_no = c.id_no
        WHERE 
            s.id_no = ?
        ORDER BY 
            c.consult_id ASC;
    `;

    db.query(combinedQuery, [idNo], (err, results) => {
        if (err) {
            console.error('Error fetching staff and consult details', err);
            return res.status(500).json({ Result: "Failure", Message: "Server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ Result: "Failure", Message: "No records found with the given ID" });
        }

        // Organize the results into separate arrays
        const staffData = [];
        const consultData = [];

        results.forEach(row => {
            // Extract staff data (only once)
            if (staffData.length === 0) {
                const age = calculateAge(row.date_of_birth);
                const { ...staff } = row;
                staffData.push({ ...staff, age });
            }

            // Extract consult data if present
            if (row.consult_id) {
                consultData.push({
                    name: row.consult_name,
                    consult_id: row.consult_id,
                    doctor1: row.doctor1,
                    Division: row.Division,
                    sick_type: row.sick_type,
                    timing: row.timing
                });
            }
        });

        // Respond with organized data
        return res.status(200).json({ 
            Result: "Success", 
            Staff: staffData, 
            Consults: consultData
        });
    });
});


module.exports = router;
