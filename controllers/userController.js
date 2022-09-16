const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');

exports.signup = BigPromise(async (req, res, next) => {

    const {name, email, password} = req.body;

    if(!email || !name || !password){
        return next(new CustomError("Name, Email and password are required fields", 400))
    }

    let result = null
    if(req.files){
        let file = req.files.photo
        result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder : 'commercial-dot-com-users',
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