const express = require('express');
require('./db/mongoose') // This will ensure that the file runs and mongoose connects to the DB.
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();


// Configure express to automatically parse JSON
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;