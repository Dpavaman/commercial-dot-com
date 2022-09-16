const { urlencoded } = require('express');
const express = require('express')
// use dotenv here if required
const app = express()
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');


//for swagger documentation
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//regular middlewares
app.use(express.json());
app.use(express.urlencoded({extended : true}));

//cookies and file middleware
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp'
}))

//temp check
app.set('view engine', 'ejs')

// morgan middleware
app.use(morgan('tiny'))

// import all routes here
const home = require('./routes/home');
const user = require('./routes/user');


// temp check for file upload
app.get('/signuptest', (req, res)=>{
    res.render('signuptest.ejs')
})


//router middleware
app.use('/api/v1/', home)
app.use('/api/v1/', user)



//export app.js
module.exports = app