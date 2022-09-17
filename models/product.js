const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name : {
        type : String, 
        required : [true, "Please provide product name"],
        trim : true,
        maxLength : [120, "Maximum allowed length for product name is 120 characters"]
    },
    price : {
        type : Number, 
        required : [true, "Please provide product price"],
        maxLength : [5, "Maximum allowed length for product price is 5 digits"]
    },
    description : {
        type : String, 
        required : [true, "Please provide product description"],
    },
    photos : [
        {
            id : {
                type : String,
                required : true
            },
            secure_url : {
                type : String,
                required : true
            }
        },
    ],
    category : {
        type : String, 
        required : [true, "Please provide product category"],
    },
    brand : {
        type : String,
        required : [true, "Please provide product brand"]
    },
    ratings : {
        type : Number,
        default : 0
    },
    numberOfReviews : {
        type : Number,
        default : 0
    },
    reviews : [
        {
            user : {
                type : mongoose.Schema.ObjectId,
                ref : 'User',
                required : true
            },
            name : {
                type : String,
                required : true,
            },
            rating : {
                type : Number,
                required : true
            },
            comment : {
                type : String,
                required : true
            }
        }
    ],
    /**
     * Below user is to maintain a record of figuring out, 
     * who is accountable for the product added to the database
     */
    user : {
        type : mongoose.Schema.ObjectId,
        ref : "User",
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }

})


module.exports = mongoose.model('Product', productSchema)