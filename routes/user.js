const express = require('express');
const { signup, login, logout, forgotPassword, resetPassword } = require('../controllers/userController');
const router = express.Router();

router.route('/signup').post(signup)
router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/forgotpassword').post(forgotPassword)
router.route('/password/reset/:token').post(resetPassword)

module.exports = router