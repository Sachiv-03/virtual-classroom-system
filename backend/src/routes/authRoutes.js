const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

module.exports = router;
