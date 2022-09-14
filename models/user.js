const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        minLength: [2, 'Name should be atleast 2 characters'],
        maxLength: [40, 'Name should be less than 40 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        validate: [validator.isEmail, "Please enter a valid email"],
        unique: [true, "Email already exists"]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: [6, 'Password should be atleast 6 characters'],
        select: false,
    },
    role: {
        type: String,
        default: 'user'
    },
    photo: {
        id: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
})



// encrypt password before save - Hooks

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
});

// validate the password with passed on user pssword 
userSchema.methods.isValidPassword = async function(inputPassword){
    return await bcrypt.compare(inputPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)