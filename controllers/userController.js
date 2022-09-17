const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const user = require('../models/user');
const mailHelper = require('../utils/emailHelper');
const crypto = require('crypto')

exports.signup = BigPromise(async (req, res, next) => {

    const {name, email, password} = req.body;

    if(!email || !name || !password){
        return next(new CustomError("Name, Email and password are required fields", 400))
    }

    let result = null
    if(req.files){
        let file = req.files.photo
        result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder : process.env.USER_IMAGES_FOLDER,
            width : 150,
            crop : 'scale'
        })
    }

    const user = await User.create({
        name, 
        email, 
        password, 
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        }
    });

    cookieToken(user, res)
})

exports.login = BigPromise(async (req, res, next) => {
    const {email, password} = req.body;

    //Check for email and password existance
    if(!email || !password){
        return next(new CustomError('please provide email and password', 400));
    }

    const user = await User.findOne({email}).select("+password") // by default the response comes without password, as specified in Schema. 

    // if user not found in DB
    if(!user){
        return next(new CustomError("Email or password does not match", 404));
    }

    const isValidPassword = await user.isValidPassword(password);

    // if password is incorrect
    if(!isValidPassword){
        return next(new CustomError("Email or password does not match", 400));
    }

    // if all goes good, 
    cookieToken(user, res)


})

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie('token', null, {
        expires : new Date(Date.now()),
        httpOnly : true
    })
    res.status(200).json({
        success : true,
        message : "Logout success"
    })
})

exports.forgotPassword = BigPromise(async (req, res, next) => {
    const {email} = req.body;
    const user = await User.findOne({email})

    if(!user){
        return next(new CustomError('Email is not registered', 400))
    }

    const forgotToken = user.getForgotPsswordToken();
    await user.save({validateBeforeSave : false})  // Just save forgotPasswordToken to db without validating schema;

    const redirectUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;
    const message = `Please visit this url to reset your password \n\n ${redirectUrl}`;


    try {
        await mailHelper({
            toEmail : user.email,
            subject : "commercial-dot-com - Reset Password",
            message
        })

        res.status(200).json({
            success : true,
            message : `Email sent successfully to ${email}`
        })
       
    } catch (error) {
        // reset forgotpasswordToken and forgotpasswordExpiry in DB if email-service fails
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry= undefined
        await user.save({validateBeforeSave : false});

        return next(new CustomError(error.message, 500))
    }

})

exports.resetPassword = BigPromise(async (req, res, next)=>{
    const token = req.params.token;

    //the token is not encrypted, we have to encrypt it and compare. a direct comparision would fail verification

    const encryptToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        forgotPasswordToken : encryptToken, 
        forgotPasswordExpiry : {$gt : Date.now()}
    })

    if(!user){
        return next(new CustomError('Token is invalid or expired', 400));
    };

    // we need both password and confirm-password fields at this stage to be passed from frontend
    if(req.body.password !== req.body.confirmPassword){
        return next(new CustomError('Password and Confirm Password are not matching'))
    };

    user.password = req.body.password
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    await user.save({validateBeforeSave : false});


    cookieToken(user, res);
})


exports.getLoggedInUserDetails = BigPromise( async (req, res, next) => {

    /**
     * req.user never exists, 
     * we are injecting it with the help of middleware, 
     * go through user.js file in middlewares filder for more understanding!
     */

   const user = await User.findById(req.user.id) ;

   res.status(200).json({
    success : true,
    user
   })
})

exports.changePassword = BigPromise(async (req, res, next) => {

    /**
     * req.user never exists, 
     * we are injecting it with the help of middleware, 
     * go through user.js file in middlewares filder for more understanding!
     */

    const userId = req.user.id

    const user = await User.findById(userId).select("+password");

    const {oldPassword, newPassword} = req.body;
    const isCorrectOldPassword = await user.isValidPassword(oldPassword);

    if(!isCorrectOldPassword){
        return next(new CustomError("old password is incorrect", 400));
    }

    if(oldPassword === newPassword){
        return next(new CustomError("You cannot reset the password to old password again", 400));
    }

    user.password = req.body.newPassword;
    await user.save();

    cookieToken(user, res)


})

exports.updateUserDetails = BigPromise(async (req, res, next) => {

    const {email, name} = req.body;

    if(!email || !name){
        return next(new CustomError("insufficient data to update user profile", 400))
    }

    const newData = {
        name,
        email 
    }

    /**
     * if Image is received through request,
     * delete the old image from cloudinary, and update new image
     */

    if(req.files && req.files.photo){
        const user = await User.findById(req.user.id);
        const imageId = user.photo.id   // from schema

        if(imageId){
            const resp = await cloudinary.v2.uploader.destroy(imageId);  // Delete existing photo on cloudinary if exists
        }


        /**
         * Upload new image received through request
         */

        const result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath, {
            folder : 'commercial-dot-com-users',
            width : 150,
            crop : 'scale'
        })

        if(result){
            newData.photo = {
                id : result.public_id,
                secure_url : result.secure_url
            }
        }
    }

    /**
     * req.user never exists, 
     * we are injecting it with the help of middleware, 
     * go through user.js file in middlewares filder for more understanding!
     */
    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new : true, 
        runValidators : true,
        useFindAndModify : false,  //Backward compatibility
    });

    res.status(200).json({
        success : true,
        user
    })
})

exports.admin_allUsers = BigPromise(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success : true,
        users
    });
})

exports.admin_getSingleUserDetails = BigPromise(async (req, res, next) => {

    const user = await User.findById(req.params.id)

    if(!user){
        return next(new CustomError('No user found', 400))
    }

    res.status(200).json({
        success : true,
        user
    })
})

exports.admin_updateOneUser = BigPromise(async (req, res, next) =>{
    const newData = {
        name : req.body.name,
        email : req.body.email,
        role : req.body.role
    };


    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new : true,
        runValidators : true,
        useFindAndModify : false
    })

    res.status(200).json({
        success : true, 
        user
    })

})

exports.admin_deleteOneUser = BigPromise(async ( req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new CustomError("No user exists in the DB", 401));
    }

    const imageId = user.photo.id;
    await cloudinary.v2.uploader.destroy(imageId);
    await user.remove()

    res.status(200).json({
        success : true,
    })


})







exports.manager_allUsers = BigPromise(async (req, res, next) => {
    const users = await User.find({role : 'user'});
    res.status(200).json({
        success : true,
        users
    });
})