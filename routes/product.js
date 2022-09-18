const express = require('express');
const { addProduct, getAllProducts, adminGetAllProducts, getOneProductDetails, adminUpdateOneProduct, adminDeleteOneProduct, addReview, deleteReview, getAllReviewsOfOneProduct } = require('../controllers/productController');
const { isLoggedIn, customRole } = require('../middlewares/user');
const router = express.Router();


//user routes
router.route('/products').get(getAllProducts)
router.route('/product/:id').get(getOneProductDetails)
router.route('/reviews/:id').get(getAllReviewsOfOneProduct)


/**
 * User should be logged in to perform below operations
 */
router.route('/product/review').post(isLoggedIn, addReview).delete(isLoggedIn, deleteReview)  


//admin route
router.route('/admin/product/add').post(isLoggedIn, customRole('admin'), addProduct)
router.route('/admin/products').get(isLoggedIn, customRole('admin'), adminGetAllProducts)
router.route('/admin/product/:id')
    .get(isLoggedIn, customRole('admin'), getOneProductDetails)
    .put(isLoggedIn, customRole('admin'), adminUpdateOneProduct)
    .delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct)


module.exports = router