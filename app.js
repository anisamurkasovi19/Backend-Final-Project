const express = require("express");
const clc = require("cli-color");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const { config } = require("dotenv");


//initializing our server
const app = express();

//setting up config.env file so that we can use content of it
config({
    path: "./config.env"
})

//variables
const store = new mongoDbSession({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});

//middlewares
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
app.use(express.static("public"));

//db connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(clc.blueBright.bold.underline("MongoDb Connected"));
    })
    .catch((error) => {
        console.log(clc.red(error));
    });

//routes
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let booksRouter = require('./routes/books');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/books', booksRouter);


app.listen(process.env.PORT, () => {
    console.log(clc.yellow(`Server is running: http://localhost:${process.env.PORT}/`));
});

module.exports = app;