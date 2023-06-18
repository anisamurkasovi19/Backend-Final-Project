var express = require('express');
var router = express.Router();

/* GET home page. */
/*
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
}); */

router.get("/", (req, res) => {
  return res.send(`<h2>Welcome to Library Management server.</h2> <p> Routes ---> To Register -> <b>/register</b> , To Login -> <b>/login</b> </p>`);
});

module.exports = router;
