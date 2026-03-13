const express = require('express');
const { register, login, forgotPassword, resetPassword, googleLogin, getMe, updateProfile } = require('../controllers/authController');
const loginLimiter = require('../middleware/loginLimiter');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/google', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);

module.exports = router;
