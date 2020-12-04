const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // Get the token from the request header.
        const token = req.header('Authorization').replace('Bearer ', '');
        // Verfiy that the token is valid by checking the secret code we set when we generated it.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find the user in the DB using the ID stored in the token, and checking the user is still logged in by finding the token in the array of tokens.
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        // Give the route handler access to the token (by adding it to the req object) so we can log out the correct session (when logged in on multiple devices).
        req.token = token;
        // Give the route handler access to the user that we fetched from the DB by adding a property on to req. 
        req.user = user;
        next();

    } catch (e) {
        res.status(401).send( { error: 'Please authenticate.' });
    }
  
};

module.exports = auth;