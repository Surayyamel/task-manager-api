// Code to connect to the DB
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true, // The old URL parser is getting depreciated 
    useCreateIndex: true, // When mongoose works with mongodb our indexes are created
    useUnifiedTopology: true,
    useFindAndModify: false
},);