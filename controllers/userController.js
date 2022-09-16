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