const mongoose = require('mongoose');

const connectWithDb = () => {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser : true,
        useUnifiedTopology : true
    }).then(() => console.log(`Database connection established`)).catch((error) => {
        console.log('Something went wrong with database connection', error);
        process.exit(1)
    })
}

module.exports = connectWithDb