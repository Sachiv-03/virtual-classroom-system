const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
<<<<<<< HEAD
        minlength: 6,
        select: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
=======
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
>>>>>>> eb350fc1270f051cd81901d9cb9f9a48dbc543be
    role: {
        type: String,
        enum: ['student', 'teacher'],
        default: 'student',
    },
    otp: String,
    otpExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
<<<<<<< HEAD
    if (!this.isModified('password') || !this.password) {
        return next();
=======
    if (!this.isModified('password')) {
        next();
>>>>>>> eb350fc1270f051cd81901d9cb9f9a48dbc543be
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
