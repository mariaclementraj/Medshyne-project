const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create for user Register
router.post('/register', async (req, res) => {
    const { 
        org_name, org_type, email, org_mobile, address, state, pincode, gst, 
        count_student, count_staff, org_reg_no, document, referral_code, 
        how_hear, contact_name, designation, contact_email, contact_mobile,
        username, password 
    } = req.body;
    
    if (!org_name || !org_type || !email || !org_mobile || !address || !state || 
        !pincode || !gst || !count_student || !count_staff || !org_reg_no || 
        !contact_name || !designation || !contact_email || !contact_mobile ||
        !username || !password) {
        return res.status(400).send('All fields are required');
    }

    // Validate function
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    if (!isValidEmail(email)) {
        return res.status(400).send('Invalid email format');
    }

    const isValidMobile = (mobile) => {
        const mobileRegex = /^\d{10}$/;
        return mobileRegex.test(mobile);
    };
    if (!isValidMobile(org_mobile) || !isValidMobile(contact_mobile)) {
        return res.status(400).send('Invalid mobile number format');
    }

    const isValidPincode = (pincode) => {
        const pincodeRegex = /^\d{6}$/;
        return pincodeRegex.test(pincode);
    };
    if (!isValidPincode(pincode)) {
        return res.status(400).send('Invalid pincode format');
    }

    const query = `INSERT INTO users (
            org_name, org_type, email, org_mobile, address, state, pincode, gst, 
            count_student, count_staff, org_reg_no, document, referral_code, 
            how_hear, contact_name, designation, contact_email, contact_mobile,
            username, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        org_name, org_type, email, org_mobile, address, state, pincode, gst, 
        count_student, count_staff, org_reg_no, document, referral_code, 
        how_hear, contact_name, designation, contact_email, contact_mobile,
        username, password
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.status(201).send('User Registered Successfully');
    });
});


// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send('Both username and password are required');
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }
        const user = results[0];
        if (password !== user.password) {
            return res.status(401).send('Invalid username or password');
        }
        res.status(200).json({ success: 'true', message: 'Login successful' });

    });
});


module.exports = router;
