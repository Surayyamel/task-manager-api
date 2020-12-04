const express = require('express');
require('./db/mongoose') // This will ensure that the file runs and mongoose connects to the DB.
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;


// Configure express to automatically parse JSON
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);


app.listen(port, () => {
    console.log('Server is up on port ' + port);
});

