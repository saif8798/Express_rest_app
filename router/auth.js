const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const User = require("../models/user");
const userController = require("../controller/user");
const isAuth = require("../middleware/is-auth");

router.get("/status", isAuth, userController.getStatus);

router.post("/login", userController.login);

router.patch(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  userController.updateStatus,
);

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-mail already exists, please pick a different one.",
            );
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  userController.signup,
);

module.exports = router;
