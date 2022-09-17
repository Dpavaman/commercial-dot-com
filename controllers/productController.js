const BigPromise = require("../middlewares/bigPromise");


exports.testProduct = BigPromise(async (req, res, next) => {
    res.status(200).json({
        success : true,
        message : "This is a test product" 
    })
})
