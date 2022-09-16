const express = require('express');
const { signup, login, logout, forgotPassword, resetPassword, getLoggedInUserDetails, changePassword, updateUserDetails, admin_allUsers, manager_allUsers } = require('../controllers/userController');
const { isLoggedIn, customRole } = require('../middlewares/user');
const router = express.Router();



router.route('/signup').post(signup)
router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/forgotpassword').post(forgotPassword)
router.route('/password/reset/:token').post(resetPassword)
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDetails)
router.route('/password/update').post(isLoggedIn, changePassword)
router.route('/userdashboard/update').post(isLoggedIn, updateUserDetails)


// admin only route
router.route('/admin/users').get(isLoggedIn, customRole('admin'), admin_allUsers);

// manager only route
router.route('/manager/users').get(isLoggedIn, customRole('manager'), manager_allUsers);

module.exports = router