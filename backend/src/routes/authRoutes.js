const express = require('express');
const { register, login, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
const loginLimiter = require('../middleware/loginLimiter');

const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/google', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

module.exports = router;
