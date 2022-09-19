const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo : {
        address : {
            type : String,
            required : true,
        },
        city : {
            type : String,
            required : true,
        },
        phoneNumber : {
            type : String,
            required : true,
        },
        postalCode : {
            type : String,
            required : true,
        },
        state : {
            type : String,
            required : true,
        },
        country : {
            type : String,
            required : true,
        },

    },
    user : {
        type : mongoose.Schema.ObjectId,   // you can also use mongoose.Schema.Types.ObjectId , we are using mongoose.Schema.ObjectId  for the sake of backward compatibility. 
        ref : "User",
        required : true
    },
    orderItems : [
        {
            name : {
                type : String,
                required : true
            },
            quantity : {
                type : Number, 
                required : true
            },
            image : {
                type : String,
                required : true
            },
            product : {
                type : mongoose.Schema.ObjectId, // you can also use mongoose.Schema.Types.ObjectId , we are using mongoose.Schema.ObjectId  for the sake of backward compatibility. 
                ref : "Product",
                required : true
            }
        }
    ],
    paymentInfo : {
        id : {
            type : String,
        },
    },
    taxAmount : {
        type : Number,
        required : true
    },
    shippingAmount : {
        type : Number,
        required : true
    },
    totalAmount : {
        type : Number,
        required : true
    },
    orderStatus : {
        type : String,
        required : true,
        default : "processing"
    },
    deliveredAt : {
        type : Date,
    },
    createdAt : {
        type : Date,
        default : Date.now
    }

})


module.exports = mongoose.model('Order', orderSchema)