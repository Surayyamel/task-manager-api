// The User model
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password') 
            } 
        }
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// Virtual property to create a relationship bewteen user and tasks
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

// Remove sensitive data from user instance
userSchema.methods.toJSON = function () { // JSON.stringify was called on the user as we send it back, so we can now manipulate the contents using .toJSON
    const user = this;
    const userObject = user.toObject(); // toObject() method provided by mongoose.
    
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

// Generate an authentication token for a user. Methods -> accessible on the instance.
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token: token});
    await user.save();
    return token;    
};


// Compare login email and password. Statics -> accessible on the User. 
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if(!user) {
        throw new Error('Unable to login.');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        throw new Error('Unable to login.');
    }
    return user;
};


// Hashing the password before saving (pre) -> This code will run whenever a user is saved.
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
   
    next();
});

// Delete user tasks when user is removed (profile deleted) -> This code will run whenever a user is deleted.
userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });

    next();
});




const User = mongoose.model('User', userSchema);

module.exports = User;