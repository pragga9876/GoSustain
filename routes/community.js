const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const { isLoggedIn } = require("../middleware/auth");

// COMMUNITY WALL — Show all posts
router.get("/", async (req, res) => {
  const posts = await Post.find().populate("user").sort({ createdAt: -1 });
  res.render("community/index", {
    title: "Community Wall | Equil",
    pageCSS: ["community"],
    currentUser: req.user,
    posts
  });
});

//  Add new post
router.post("/", isLoggedIn, async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    req.flash("error", "Message cannot be empty!");
    return res.redirect("/community");
  }

  await Post.create({
    user: req.user._id,
    username: req.user.username,
    message
  });

  req.flash("success", "Your eco action was shared!");
  res.redirect("/community");
});

//  Like a post
router.post("/:id/like", isLoggedIn, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post) {
    post.likes += 1;
    await post.save();
  }
  res.redirect("/community");
});

module.exports = router;
