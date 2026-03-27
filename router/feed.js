const { body } = require("express-validator");
const express = require("express");
const isAuth = require("../middleware/is-auth");

const feedController = require("../controller/feed");

const router = express.Router();

router.get("/posts", isAuth, feedController.getFeed);

router.get("/post/:postId", isAuth, feedController.getPost);

router.post(
  "/post",
  isAuth,
  [
    body("title")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Title must be at least 5 characters long"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters long"),
  ],
  feedController.createPost,
);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Title must be at least 5 characters long"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters long"),
  ],
  feedController.updatePost,
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
