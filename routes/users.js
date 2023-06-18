var express = require('express');
var router = express.Router();

const userModel = require('../models/userModel');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcrypt");

/*
const { isAuth } = require("../middlewares/isAuthmiddleware");

const {
  cleanupAndValidate,
  genrateJWTToken,
  sendVerificationToken,
} = require("../utils/authUtils"); */

/* GET users listing. */
router.get("/register", (req, res) => {
  return res.render("register");
});

router.post("/register", async (req, res) => {
  const { name, username, email, phone, password } = req.body;
  //Data validation
  try {
      await cleanupAndValidate({ name, username, email, phone, password });
  } catch (error) {
      return res.send({
          status: 400,
          message: "Data Error",
          error: error,
      });
  }

  //check is the email exits or not in Db;
  const userObjEmailExits = await userModel.findOne({ email });

  if (userObjEmailExits) {
      return res.send({
          status: 400,
          message: "Email Already Exits",
      });
  }

  //check is the username exits or not in Db;
  const userObjUsernameExits = await userModel.findOne({ username });

  if (userObjUsernameExits) {
      return res.send({
          status: 400,
          message: "Username Already Exits",
      });
  }

  //password hashing
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALTROUNDS));

  //Create userObj
  const userObj = new userModel({
      name: name,
      username: username,
      email: email,
      phone: phone,
      password: hashedPassword,
  });

  //genrate token
  const token = genrateJWTToken(email);

  //Save in Db
  try {
      const userDb = await userObj.save();
      //send token to user
      const subject = `Hello ${name}, verify your account!`;
      const content = `Dear ${name}, thank you for creating a new account. Now it's a time to verify your account.`
      const requestType = "account/verify"
      sendVerificationToken({ token, email, subject, content, requestType });
      console.log("We have sent a mail to your registered email. Please verify your account before login!");
      return res.render("login");
  } catch (error) {
      return res.send({
          status: 500,
          message: "Database Error",
          error: error.message,
      });
  }
});

router.get("/login", (req, res) => {
  return res.render("login");
});

router.post("/login", async (req, res) => {
  //console.log(req.body);
  const { loginId, password } = req.body;
  //Data validation

  if (!loginId || !password) {
      return res.send({
          status: 400,
          message: "Missing credentials",
      });
  }

  if (typeof loginId !== "string" || typeof password !== "string") {
      return res.send({
          status: 400,
          message: "Invalid Data Format",
      });
  }

  //find the user obj from loginId
  let userDb;
  if (validator.isEmail(loginId)) {
      userDb = await userModel.findOne({ email: loginId });
  } else {
      userDb = await userModel.findOne({ username: loginId });
  }
  // console.log(userDb);
  if (!userDb) {
      return res.send({
          status: 400,
          message: "User does not exist, Please register first",
      });
  }
  //eamilAuthenticated or not
  if (userDb.emailAuthenticated === false) {
      return res.send({
          status: 400,
          message: "Please verfiy your email first",
      });
  }

  //compare the password

  const isMatch = await bcrypt.compare(password, userDb.password);
  //   console.log(isMatch);
  if (!isMatch) {
      return res.send({
          status: 400,
          message: "Password incorrect",
      });
  }
  //successfull login

  //   console.log(req.session);
  req.session.isAuth = true;
  req.session.user = {
      username: userDb.name,
      email: userDb.email,
      phone: userDb.phone,
      userId: userDb._id,
  };

  console.log(req.session);

  return res.render("dashboard", { name: userDb.name });
});

// route to render page resendVerifyLink
router.get("/resend-verification", (req, res) => {
  return res.render("resendVerifyLink");
});

//route to resend verification mail
router.post("/resend-verification", async (req, res) => {
  const { loginId } = req.body;

  //Data validation
  if (!loginId) {
      return res.send({
          status: 400,
          message: "Missing email/username",
      });
  }

  if (typeof loginId !== "string") {
      return res.send({
          status: 400,
          message: "Invalid Data Format",
      });
  }

  //find the user obj from loginId
  let userDb;
  if (validator.isEmail(loginId)) {
      userDb = await userModel.findOne({ email: loginId });
  } else {
      userDb = await userModel.findOne({ username: loginId });
  }
  // console.log(userDb);
  if (!userDb) {
      return res.send({
          status: 400,
          message: "User does not exist, Please register first",
      });
  }

  //eamilAuthenticated or not
  if (userDb.emailAuthenticated === true) {
      return res.send({
          status: 400,
          message: "Your account is already verified! Please login.",
      });
  }

  //genrate token
  const token = genrateJWTToken(userDb.email);
  //get user email
  const email = userDb.email;

  try {
      //send token to user
      const subject = `Hello ${userDb.name}, verify your account!`;
      const content = `Dear ${userDb.name}, we have received your request. Now it's a time to verify your account.`
      const requestType = "account/verify"
      sendVerificationToken({ token, email, subject, content, requestType });
      console.log("We have sent a mail to your registered email. Check your mail to verify your account.");
      return res.render("login");
  } catch (error) {
      return res.send({
          status: 500,
          message: "Database Error",
          error: error,
      });
  }

});

// route to render page forgetPassword
router.get("/forget-password", (req, res) => {
  return res.render("forgetPassword");
});

// route to send forget password mail
router.post("/forget-password", async (req, res) => {
  const { loginId } = req.body;

  //Data validation
  if (!loginId) {
      return res.send({
          status: 400,
          message: "Missing email/username",
      });
  }

  if (typeof loginId !== "string") {
      return res.send({
          status: 400,
          message: "Invalid Data Format",
      });
  }

  //find the user obj from loginId
  let userDb;
  if (validator.isEmail(loginId)) {
      userDb = await userModel.findOne({ email: loginId });
  } else {
      userDb = await userModel.findOne({ username: loginId });
  }
  // console.log(userDb);
  if (!userDb) {
      return res.send({
          status: 400,
          message: "User does not exist, Please register first",
      });
  }

  //genrate token
  const token = genrateJWTToken(userDb.email);
  //get user email
  const email = userDb.email;

  try {
      //send token to user
      const subject = `Hello ${userDb.name}, reset your account password!`;
      const content = `Dear ${userDb.name}, we have received your request. Now it's time to reset your account password.`
      const requestType = "reset/password"
      sendVerificationToken({ token, email, subject, content, requestType });
      console.log("We have sent a mail to your registered mail to reset your password.");
      return res.render("login");
  } catch (error) {
      return res.send({
          status: 500,
          message: "Internal Server Error",
          error: error,
      });
  }

});

// route to render page to enter new password
router.get("/api/reset/password/:id", (req, res) => {
  return res.render("newPassword", { id: req.params.id });
});

// route to update user account password
router.post("/api/reset/password/:id", async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  //Data validation
  if (!newPassword || !confirmPassword) {
      return res.send({
          status: 400,
          message: "Missing credentials!",
      });
  }

  if (newPassword !== confirmPassword) {
      return res.send({
          status: 400,
          message: "New Password and Confirm Password are not matching. Try again!",
      });
  }

  if (newPassword.length < 5 || newPassword.length > 20) {
      return res.send({
          status: 400,
          message: "Password should be 5-20 characters long.",
      });
  }

  // get token
  const token = req.params.id;

  //find user with this token after decoding it
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      try {
          //password hashing
          const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALTROUNDS));
          await userModel.findOneAndUpdate(
              { email: decoded },
              { password: hashedPassword }
          );
          console.log("Your password is updated! Click 'OK' to redirect to Login Page.");
          return res.redirect("/login");
      } catch (error) {
          return res.send({
              status: 500,
              message: "Email Authentication Failed",
          });
      }
  });
});


//route to verify account
//http:localhost:8000/api/djflkzdsfnsidfhepqwofhjpoaewfjaqpof
router.get("/api/account/verify/:id", async (req, res) => {
  //   console.log(req.params);
  const token = req.params.id;

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      // console.log(decoded);
      try {
          await userModel.findOneAndUpdate(
              { email: decoded },
              { emailAuthenticated: true }
          );
          console.log("Your account is verified! Click 'OK' to redirect to Login Page.");
          return res.redirect("/login");
      } catch (error) {
          return res.send({
              status: 500,
              message: "Email Authentication Failed",
          });
      }
  });
});


// route to logout
router.post("/logout", isAuth, (req, res) => {
  req.session.destroy((error) => {
      if (error) throw error;
      return res.redirect("/login");
  });
});

module.exports = router;
