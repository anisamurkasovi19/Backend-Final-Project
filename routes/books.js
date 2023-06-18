var express = require('express');
var router = express.Router();

const bookService = require('../services/bookService')

const { isAuth } = require("../middlewares/isAuthmiddleware");
const Ratelimiting = require("../middlewares/rateLimiting");

/* GET books. */

// route to render dashboard page
router.get("/dashboard", isAuth, async (req, res) => {
    return res.render("dashboard");
});


//library routes

// route to add a new book 
router.post("/create-item", isAuth, Ratelimiting, bookService.createItem);

// route to edit book details
router.post("/edit-item", isAuth, Ratelimiting, bookService.editItem);

//delete homework
router.post("/delete-item", isAuth, Ratelimiting, bookService.deleteItem);

// /pagination_dashboard?skip=10

router.get("/pagination_dashboard", isAuth, bookService.paginationDashboard);


module.exports = router;