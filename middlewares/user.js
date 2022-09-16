const User = require("../models/user");
const CustomError = require("../utils/customError");
const BigPromise = require("./bigPromise");
const jwt = require('jsonwebtoken')


exports.isLoggedIn = BigPromise(async (req, res, next) => {
    const token = req.cookies.token || req.header('Authorization')?.replace("Bearer ", "");  //mostly token will be received through headers if it is a mobile consumer

    if(!token){
        return next(new CustomError("User is not logged in", 401));
    };

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if(decodedToken.id){

        /**
         * we even have decodedToken.email,
         * since we have constructed token in user model in such a way that
         * it consists both id and email
         */
        req.user = await User.findById(decodedToken.id);  
        next()

    }

});


exports.customRole = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new CustomError('You are not allowed to access this resource', 402));
        };

        next();
    }
}


