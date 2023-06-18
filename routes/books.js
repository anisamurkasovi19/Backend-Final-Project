var express = require('express');
var router = express.Router();

const { isAuth } = require("../middlewares/isAuthmiddleware");
const bookModel = require("../models/bookModel");
const Ratelimiting = require("../middlewares/rateLimiting");

/* GET books. */

// route to render dashboard page
router.get("/dashboard", isAuth, async (req, res) => {
    return res.render("dashboard");
});


//library routes

// route to add a new book 
router.post("/create-item", isAuth, Ratelimiting, async (req, res) => {
    const { bookTitle, bookAuthor, bookPrice, bookCategory } = req.body;
    const username = req.session.user.username;

    //data validation
    if (!bookTitle || !bookAuthor || !bookPrice || !bookCategory) {
        return res.send({
            status: 400,
            message: "Missing credentials",
        });
    }

    if (bookTitle.length < 3 || bookTitle.length > 30) {
        return res.send({
            status: 400,
            message:
                "Title is either small or too large.",
        });
    }

    //intialized todo Schema and store it in Db
    const bookObj = new bookModel({
        bookTitle: bookTitle,
        bookAuthor: bookAuthor,
        bookPrice: bookPrice,
        bookCategory: bookCategory,
        username: username,
    });

    //save in db
    try {
        const bookDb = await bookObj.save();
        return res.send({
            status: 201,
            message: "New Book Created Successfully",
            data: bookDb,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Dabase error",
            error: error,
        });
    }
});

// route to edit book details
router.post("/edit-item", isAuth, Ratelimiting, async (req, res) => {
    const { bookTitle, bookAuthor, bookPrice, bookCategory, id } = req.body;
    const username = req.session.user.username;

    //data validation
    if (!bookTitle || !bookAuthor || !bookPrice || !bookCategory) {
        return res.send({
            status: 400,
            message: "Missing credentials",
        });
    }
    if (bookTitle.length < 3 || bookTitle.length > 50) {
        return res.send({
            status: 400,
            message:
                "Title is either small or too large.",
        });
    }

    //find the book
    const bookDetails = await bookModel.findOne({ _id: id });
    if (!bookDetails) {
        return res.send({
            status: 400,
            message: "Book not found!",
        });
    }
    //check ownership
    if (bookDetails.username !== username) {
        return res.send({
            status: 401,
            message: "Not allowed to edit, authorisation failed",
        });
    }

    try {
        const bookDb = await bookModel.findOneAndUpdate(
            { _id: id },
            {
                bookTitle: bookTitle,
                bookAuthor: bookAuthor,
                bookPrice: bookPrice,
                bookCategory: bookCategory,
            }
        );
        // console.log(todoDb);
        return res.send({
            status: 200,
            message: "Book details updated successfully",
            data: bookDb,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});

//delete homework
router.post("/delete-item", isAuth, Ratelimiting, async (req, res) => {
    const { id } = req.body;
    const username = req.session.user.username;

    //find the todo
    const todoDetails = await bookModel.findOne({ _id: id });
    if (!todoDetails) {
        return res.send({
            status: 400,
            message: "book not found",
        });
    }

    //check ownership
    if (todoDetails.username !== username) {
        return res.send({
            status: 401,
            message: "Not allowed to delete, authorisation failed",
        });
    }

    try {
        const bookDb = await bookModel.findOneAndDelete({ _id: id });
        // console.log(todoDb);
        return res.send({
            status: 200,
            message: "book deleted successfully",
            data: bookDb,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});

// router.get("/read-item", isAuth, async (req, res) => {
//   //username
//   const username = req.session.user.username;
//   try {
//     const todoDb = await bookModel.find({ username: username });
//     console.log(todoDb);

//     return res.send({ status: 200, message: "Read success", data: todoDb });
//   } catch (error) {
//     return res.send(error);
//   }
// });

// /pagination_dashboard?skip=10

router.get("/pagination_dashboard", isAuth, async (req, res) => {
    const skip = req.query.skip || 0;
    const LIMIT = 5;
    const username = req.session.user.username;

    //aggregate function
    //pagination match
    //which query needs to be performed first?
    try {
        const todos = await bookModel.aggregate([
            { $match: { username: username } },
            {
                $facet: {
                    data: [{ $skip: parseInt(skip) }, { $limit: LIMIT }],
                },
            },
        ]);

        return res.send({
            status: 200,
            message: "Read Success",
            data: todos[0].data,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});


module.exports = router;