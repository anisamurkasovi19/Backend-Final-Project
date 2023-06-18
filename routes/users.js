var express = require('express');
var router = express.Router();

const userService = require("../services/userService")
const { isAuth } = require("../middlewares/isAuthmiddleware");

/* GET users listing. */

router.get("/register", (req, res) => {
  return res.render("register");
});

router.post("/register", userService.register);

router.get("/login", (req, res) => {
  return res.render("login");
});

router.post("/login", userService.login);

// route to render page resendVerifyLink
router.get("/resend-verification", (req, res) => {
  return res.render("resendVerifyLink");
});

//route to resend verification mail
router.post("/resend-verification", userService.resendVerification);

// route to render page forgetPassword
router.get("/forget-password", (req, res) => {
  return res.render("forgetPassword");
});

// route to send forget password mail
router.post("/forget-password", userService.forgetPassword);

// route to render page to enter new password
router.get("/api/reset/password/:id", (req, res) => {
  return res.render("newPassword", { id: req.params.id });
});

// route to update user account password
router.post("/api/reset/password/:id", userService.resetPassword);

//route to verify account
router.get("/api/account/verify/:id", userService.verifyAccount);

// route to logout
router.post("/logout", isAuth, (req, res) => {
  req.session.destroy((error) => {
      if (error) throw error;
      return res.redirect("/login");
  });
});

module.exports = router;
