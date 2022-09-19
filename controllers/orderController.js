const BigPromise = require("../middlewares/bigPromise");
const Order = require("../models/order");
const product = require("../models/product");
const Product = require("../models/product");
const CustomError = require("../utils/customError");


exports.createOrder = BigPromise(async (req, res, next) => {

     /**
      * necessary fields are received through request body 
      */
    const {shippingInfo, orderItems, paymentInfo, taxAmount, shippingAmount, totalAmount} = req.body

    /**
     * Below properties has to be accessed from our end
     * 1. user, 
     * 2. deliveredAt, will be updated once the deliver is completed
     */


    const orderObj = {
        shippingInfo, 
        orderItems, 
        paymentInfo, 
        taxAmount,
        shippingAmount, 
        totalAmount,
        user : req.user._id
    }
    const order = await Order.create(orderObj);

    res.status(200).json({
        success : true, 
        order
    })

})


exports.getOneOrder = BigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');  

    /**
     * populate method drills down more of the information,
     * In this above case, user property will be user name and email instead of just an Id
     */


    if(!order){
        return next(new CustomError("No such order exists!", 400))
    }

    res.status(200).json({
        success : true,
        order
    })
});

exports.getAllOrdersOfUser = BigPromise(async (req, res, next) => {
    const orders = await Order.find({user : req.user._id});

    if(!orders){
        return next(new CustomError("No orders available", 400));
    }

    res.status(200).json({
        success : true, 
        orders
    })
})


//admin routes
exports.adminGetAllOrders = BigPromise(async (req, res, next)=>{
    const orders = await Order.find();


    res.status(200).json({
        success : true,
        orders
    })
})

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if(!order){
        return next(new CustomError('no such order exists', 400))
    }

    if(order.orderStatus === 'Delivered'){
        return next(new CustomError("This order is already delivered", 401))
    }

    if(!req.body.orderStatus){
        return next(new CustomError("Please provide order status", 400))
    }

    order.orderStatus = req.body.orderStatus
    order.orderItems.forEach(async (item) => {
        await updateProductStock(item.product, product.quantity)
    })
    await order.save()

    res.status(200).json({
        success : true,
        order
    })
});


exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new CustomError("No order exists", 400));
    };

    await order.remove();

    res.status(200).json({
        success : true
    })
})


const updateProductStock = async (productId, quantity) =>{
    const product  = await Product.findById(productId);

    // add a stock check before subtracting blindly
    product.stock = product.stock - quantity;

   await  product.save({
        validateBeforeSave : false
    })
}