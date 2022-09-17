const express = require('express');
const { testProduct } = require('../controllers/productController');
const router = express.Router();



router.route('/testproduct').get(testProduct)





module.exports = router