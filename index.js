const app = require('./app');  // Import app.js
const connectWithDb = require('./config/db');
const cloudinary = require('cloudinary');
require('dotenv').config(); // import and configure dotenv


//connect with database
connectWithDb()

// connect with cloudinary
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})


app.listen(process.env.PORT, () => {
    console.log(`Server is up and running at port ${process.env.PORT}`);
});