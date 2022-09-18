const BigPromise = require("../middlewares/bigPromise");
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const CustomError = require('../utils/customError');
const QueryHelper = require("../utils/queryHelper");
const { findById } = require("../models/product");


//general controllers 
exports.addProduct = BigPromise(async (req, res, next) => {
    //images. 
    const imagesArray = [];


    if (!req.files) {
        return next(new CustomError("Please provide product images", 401));
    }


    if (req.files && req.files.photos && req.files.photos.length) {

        for (let ind = 0; ind < req.files.photos.length; ind++) {
            const result = await cloudinary.v2.uploader.upload(req.files.photos[ind].tempFilePath, {
                folder: process.env.PRODUCT_IMAGES_FOLDER
            })


            if (result) {
                imagesArray.push({
                    id: result.public_id,
                    secure_url: result.secure_url
                })
            }
        }
    }


    req.body.photos = imagesArray;
    req.body.user = req.user.id;


    /**
     * apart from above properties, the request has to server the route with, 
     * * Name of Product,
     * * Price of Product,
     * * Description of Product,
     * * Photos --- we are crafting it from files.
     * * category, 
     * * brand,
     * * user -  we are grabbing it from logged-in user
     */

    /**
     * 
     *  All the below properties are not needed during adding a new product
     * * rating,
     * * numberOfReviews,
     * * Reviews, 
     * * CreatedAt -- Automatically added!
     */

    const product = await Product.create(req.body);


    res.status(200).json({
        success: true,
        product
    })

})

exports.getAllProducts = BigPromise(async (req, res, next) => {
    const resultsPerPage = 6

    const productCount = await Product.countDocuments() // to get all product count from DB



    const productsObj = new QueryHelper(Product.find(), req.query).search().filter();

    let products = await productsObj.model
    const filteredProductsCount = products.length
    productsObj.pager(resultsPerPage)
    products = await productsObj.model.clone()   // chain .clone at the end if you are making multiple actions on mongoDB instance

    res.status(200).json({
        success: true,
        totalCount: productCount,
        filteredProductsCount,
        products,
    })
})

exports.getOneProductDetails = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        next(new CustomError("No product found with this Id", 401));
    }

    res.status(200).json({
        success: true,
        product
    })

})

exports.addReview = BigPromise(async (req, res, next) => {
    /**
     * We are expecing product Id, through request body!
     */

    const { productId, comment, rating } = req.body;

    // Construct review payload, check product model for clarity. 
    const review = {
        user: req.user._id, // This is the objectId  (from DB ) of the user adding the review,
        name: req.user.name,
        rating: Number(rating),
        comment
    };


    const product = await Product.findById(productId);

    if (!productId) {
        return next(new CustomError("No such product available", 400))
    };


    /**
     * Before pushing review into database, 
     * check whether user has already reviewed the product,
     *  if yes, Just update the previous review, 
     * if no, push a new review onto the product under the name of requesting user. 
     */

    const userAlreadyReviewed = product.reviews.find((review) => {  // .find is classing JavaScript array method
        return review.user.toString() === req.user._id.toString()   // convert the id to String, since it is a BSON data
    })

    if (userAlreadyReviewed) {
        userAlreadyReviewed.comment = comment;
        userAlreadyReviewed.rating = rating
    } else {
        product.reviews.push(review);   // Push review to the reviews array
        product.numberOfReviews = product.reviews.length // Update total Number of reviews property on DB
    }

    // Finally set ratings (aka Avg. Ratings, which is calculated based on total reviews. )

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;


    // Save the product finally

    await product.save({
        validateModifiedOnly: true
    })


    res.status(200).json({
        success: true,
        message: "Review posted successfully!"
    })

})

exports.deleteReview = BigPromise(async (req, res, next) => {
    const { productId } = req.body; // receiving productId throught request body

    let product = await Product.findById(productId);

    if (!product) {
        return next(new CustomError("No such product exists", 400))
    };

    /**
     * Filter out the review that belongs to the requesting user. 
     * update number of reviews, avg. ratings
     * and push the rest of reviews back to the database!
     */
    const reviews = product.reviews.filter((review) => review.user.toString() === req.user._id);

    const numberOfReviews = reviews.length;

    // update product

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / numberOfReviews

    product = await Product.findByIdAndUpdate(productId, {
        reviews,
        ratings,
        numberOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
        product
    })

})

exports.getAllReviewsOfOneProduct = BigPromise(async (req, res, next) => {
    const { productId } = req.params;  // Expecting productId through params 

    if (!productId) {
        return next(new CustomError("Please provide productId", 400))
    };

    const product = await findById(productId);

    if (!product) {
        return next(new CustomError("No such product exists!", 400))
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
        total_reviews : product.numberOfReviews,
        average_ratings: product.ratings
    })

})


// Admin only controllers

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({
        success: true,
        products
    })
})

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new CustomError("No such product available", 401));
    }

    if (req.files.photos) {
        // First destroy existing images. 

        for (let ind = 0; ind < product.photos.length; ind++) {
            const deleteResult = await cloudinary.v2.uploader.destroy(product.photos[ind].id)

        }

        let imagesArray = [];

        //Upload new images, 

        for (let ind = 0; ind < req.files.photos.length; ind++) {
            const uploadResult = await cloudinary.v2.uploader.upload(req.files.photos[ind].tempFilePath, {
                folder: process.env.PRODUCT_IMAGES_FOLDER
            })

            if (uploadResult) {
                imagesArray.push({
                    id: uploadResult.public_id,
                    secure_url: uploadResult.secure_url
                })
            }
        }

        req.body.photos = imagesArray
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidatoes: true,
            useFindAndModify: false
        })

        return res.status(200).json({
            success: true,
            product: updatedProduct
        })

    }

    res.status(400).json({
        success: false,
        message: "No photos to upload"
    })

})

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new CustomError("No such product found in DB", 400));
    }

    //Destroy all the images before deleting the product from DB. 

    for (let ind = 0; ind < product.photos.length; ind++) {
        await cloudinary.v2.uploader.destroy(product.photos[ind].id);
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: 'product deleted successfully!'
    })


})