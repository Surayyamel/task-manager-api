const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');
const router = new express.Router();


// Create a new user (sign-up)
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch(e) {
        res.status(400).send(e);
    }
});

// User login with email and password
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        
        res.send({ user, token }); // JSON.stringify() automatically gets called on the user when it's sent back. -> when JSON.stringify() is called, the toJSON() method is automatically called (we initiated it in the user model) and there we customise the JSON we send back.
    } catch (e) {
        res.status(400).send();
    }
});

// Log out current session
router.post('/users/logout', auth, async (req, res) => {
    try {
        // req.user is the authnticated user sent back from the authentication middleware.
        req.user.tokens = req.user.tokens.filter((token) => { // Set the tokens array equal to a filtered version of itself.
            return token.token !== req.token; // Return true when the token we're looking at isn't the one used for authentication.
        });
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

// Log out all sessions (all devices)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

// Get user. Using "auth" middleware.
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user); // We added the user property to the request in the middleware.
});

// Update user by ID
router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]; // We are setting the update key on the user to be equal to the update key on the body. Ex: req.user.name = req.body.name. We don't use dot notation because it must be dynamic.
        });
        await req.user.save()

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e)
    }
});

// Delete user by ID
router.delete('/users/me', auth, async (req, res) => {
    try {
        // We attached the autenticated user to the request in the middleware. We use the remove() method on the mongoose document.
        await req.user.remove(); 
        sendCancelEmail(req.user.email, req.user.name);

        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

// Configure multer for image validation
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'));
        }
        cb(undefined, true);
    }
});

// Add a profile picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();

    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Delete profile picture
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();

    res.send();  
});

// Get profile picture by ID (URL)
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }
    
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});


module.exports = router;