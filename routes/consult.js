const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// Create a consult-register entry
router.post('/consult-register', (req, res) => {
  const { doctor1, id_no, name, symptom, class: consultClass, division, sick_type, roles, timing } = req.body;

  if (!doctor1 || !id_no || !name || !symptom || !consultClass || !division || !sick_type || !roles || !timing) {
    return res.status(400).json({ Result: "Failure", Message: "All fields are required" });
  }

  const query = `
    INSERT INTO consult (doctor1, id_no, name, symptom, class, division, sick_type, roles, timing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const values = [doctor1, id_no, name, symptom, consultClass, division, sick_type, roles, timing];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error registering consult', err);
      return res.status(500).json({ Result: "Failure", Message: "Server error" });
    }
    res.status(201).json({ Result: "Success", Message: "Consult Registered Successfully" });
  });
});


// Helper function to calculate age from date_of_birth
function calculateAge(dateOfBirth) {
    const diff = Date.now() - new Date(dateOfBirth).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// View consult details
router.get('/consult-view/:consult_id', (req, res) => {
    const consultId = req.params.consult_id;

    // Query to log all consult records
    const logAllConsultsQuery = `SELECT * FROM consult`;

    connection.query(logAllConsultsQuery, (err, allConsults) => {
        if (err) {
            console.error('Error fetching all consults', err);
            return res.status(500).json({ Result: "Failure", Message: "Server error" });
        }

        // console.log('All consult records:', allConsults);

        // Query for consult to verify if it exists
        const getConsultQuery = `SELECT * FROM consult WHERE consult_id = ?`;

        connection.query(getConsultQuery, [consultId], (err, consultResults) => {
            if (err) {
                console.error('Error fetching consult ID', err);
                return res.status(500).json({ Result: "Failure", Message: "Server error" });
            }

            if (consultResults.length === 0) {
                console.error('No consult found with the given ID:', consultId);
                return res.status(404).json({ Result: "Failure", Message: "No consult found with the given ID" });
            }

            const consultData = consultResults[0];
            const idNo = consultData.id_no;
            // console.log('Consult found with id_no:', idNo);

            // Query for students
            const studentQuery = `
                SELECT c.id_no, c.name, c.consult_id, c.doctor1, c.class, c.division, c.sick_type, s.upload_photo, s.date_of_birth, p.mobile 
                FROM consult c
                JOIN students s ON c.id_no = s.id_no
                JOIN parents p ON s.id_no = p.student_id_no
                WHERE c.consult_id = ?
            `;

            // Query for staff
            const staffQuery = `
                SELECT c.id_no, c.name, c.consult_id, c.doctor1, c.class, c.division, c.sick_type, sf.upload_photo, sf.date_of_birth, sf.mobile 
                FROM consult c
                JOIN staff sf ON c.id_no = sf.id_no
                WHERE c.consult_id = ?
            `;

            connection.query(studentQuery, [consultId], (err, studentResults) => {
                if (err) {
                    console.error('Error fetching student consult details', err);
                    return res.status(500).json({ Result: "Failure", Message: "Server error" });
                }

                if (studentResults.length > 0) {
                    const result = studentResults[0];
                    result.age = calculateAge(result.date_of_birth);
                    delete result.date_of_birth;
                    // console.log('Student result:', result);
                    return res.status(200).json({ Result: "Success", Data: result });
                }

                connection.query(staffQuery, [consultId], (err, staffResults) => {
                    if (err) {
                        console.error('Error fetching staff consult details', err);
                        return res.status(500).json({ Result: "Failure", Message: "Server error" });
                    }

                    if (staffResults.length > 0) {
                        const result = staffResults[0];
                        result.age = calculateAge(result.date_of_birth);
                        delete result.date_of_birth;
                        // console.log('Staff result:', result);
                        return res.status(200).json({ Result: "Success", Data: result });
                    }

                    console.error('No consult details found for the given consult_id:', consultId);
                    return res.status(404).json({ Result: "Failure", Message: "No consult found with the given ID" });
                });
            });
        });
    });
});

module.exports = router;
