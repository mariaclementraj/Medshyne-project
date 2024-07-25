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

    if (!name || !id_no || !new_pwd || !con_pwd || !address || !state || !pincode ||
        !className || !division || !date_of_birth || !department || !designation || 
        !mobile) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (new_pwd !== con_pwd) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Validation functions
    const isValidMobile = (mobile) => {
        const mobileRegex = /^\d{10}$/;
        return mobileRegex.test(mobile);
    };

    if (!isValidMobile(mobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }

    const isValidPincode = (pincode) => {
        const pincodeRegex = /^\d{6}$/;
        return pincodeRegex.test(pincode);
    };

    if (!isValidPincode(pincode)) {
        return res.status(400).json({ success: false, message: 'Invalid pincode format' });
    }

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

    db.query(query, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Success: false, Message: 'Server error' });
        }
        res.status(201).json({ Success: True, Message: 'Staff Registered Successfully' });
    });
});

module.exports = router;
