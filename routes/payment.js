const express = require('express');
const { sendStripeKey, sendRazorPayKey, captureStripePayment, captureRazorPayPayment } = require('../controllers/paymentController');
const { isLoggedIn } = require('../middlewares/user');
const router = express.Router();

router.route('/stripekey').get(isLoggedIn, sendStripeKey);
router.route('/razorpaykey').get(isLoggedIn, sendRazorPayKey);

router.route('/stripepayment').post(isLoggedIn, captureStripePayment);
router.route('/razorpaypayment').post(isLoggedIn, captureRazorPayPayment);


module.exports = router