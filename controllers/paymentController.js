const BigPromise = require('..//middlewares/bigPromise')
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Razorpay = require('razorpay')
const {nanoid} = require('nanoid')

exports.sendStripeKey = BigPromise(async (req, res, next) => {
    res.json({
        stripekey : process.env.STRIPE_API_KEY
    })
})

exports.captureStripePayment = BigPromise(async (req, res, next)=>{
    const paymentIntent = await stripe.paymentIntents.create({
        amount : req.body.amount,
        currency : 'inr',

        //optional
        metadata: {
            integration_check: 'accept_a_payment'
        }
    });

    res.status(200).json({
        success : true,
        client_secret : paymentIntent.client_secret
        //You cam send any other informations if required. 
    })
})

exports.sendRazorPayKey = BigPromise(async (req, res, next) => {
    res.json({
        razorPay_key : process.env.RAZORPAY_API_KEY
    })
})

exports.captureRazorPayPayment = BigPromise(async (req, res, next) => {
    var instance = new Razorpay({ key_id: RAZORPAY_API_KEY, key_secret: RAZORPAY_SECRET })

    const options = {
        amount : req.body.amount,   // Amount in smallest currency unit
        currency : "INR",
        receipt : nanoid()
    }

    const order = await instance.orders.create(options);
    res.status(200).json({
        success : true,
        amount : req.body.amount,
        order 
    })
})
