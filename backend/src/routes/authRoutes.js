const express = require('express');
<<<<<<< HEAD
const { register, login, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
=======
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
>>>>>>> eb350fc1270f051cd81901d9cb9f9a48dbc543be

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
<<<<<<< HEAD
router.post('/google', googleLogin);
=======
>>>>>>> eb350fc1270f051cd81901d9cb9f9a48dbc543be
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

module.exports = router;
