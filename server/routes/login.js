const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body;
  // TODO:adialon implement login
  res.send({ email, password }).status(200);
});     

module.exports = router;
