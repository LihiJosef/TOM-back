const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { id, password } = req.body;
  // TODO:adialon implement login
  res.send({ id, password }).status(200);
});

module.exports = router;
