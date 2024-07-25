const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routes/user');
const staffRouter = require('./routes/staff');
const studentRouter = require('./routes/student');

const app = express();
const port = 3002;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/', userRouter);
app.use('/', staffRouter);
app.use('/', studentRouter);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
