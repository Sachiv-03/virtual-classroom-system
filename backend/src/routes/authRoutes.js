const express = require('express');
const { register, login, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
const loginLimiter = require('../middleware/loginLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/google', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

module.exports = router;
