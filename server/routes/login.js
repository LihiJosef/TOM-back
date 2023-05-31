
const axios = require("axios");
const express = require("express");
const router = express.Router();

/**
 * Validate user credentials and fetch access token for user
 * @param {String} userId 
 * @param {String} password 
 * 
 * @returns {Promise<String>} access token
 */
async function validateUserCredentials(userId, password) {
  const response = await axios.put(process.env.AUTH_API + "/passwords/validate", { userId: userId, password: password });

  if (!response?.data?.token) {
    throw `Invalid username or password: ${userId}`;
  }

  return response.data.token;
}

router.post("/", async (req, res) => {
  const { userId, password } = req.body;
  try {
    const token = await validateUserCredentials(userId, password);
    res.send({ token: token }).status(200).end();

  } catch (exception) {
    console.log(exception);
    res.status(401).end();
  }
});

module.exports = router;
