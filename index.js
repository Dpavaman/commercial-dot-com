const app = require('./app');  // Import app.js
require('dotenv').config(); // import and configure dotenv

app.listen(process.env.PORT, () => {
    console.log(`Server is up and running at port ${process.env.PORT}`);
})