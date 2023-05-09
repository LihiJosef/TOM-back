
const axios = require("axios");
const { responseHandler } = require("../utilities");
const userMDL = require("../../database/models").User;
const DAL = require("../DAL");

/**
 * Make request to auth server to validate access token, return the userId if valid
 * @param {string} token
 * 
 * @returns {Promise<String>}
 */
async function validateAccessToken(token) {
  if (!token) {
    throw "Token is missing";
  }

  const response = await axios.put(process.env.AUTH_API + "/tokens/validate", { token: token });
  if (!(response?.data?.userId)) {
    throw "Token is invalid";
  }

  return response.data.userId;
}

module.exports = async (req, res, next) => {
  console.log("A)" + req.url)
  try {
    // const userId = await validateAccessToken(req.headers.authorization);
    const userId = await validateAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODM1ODIyOTYsInVzZXJJZCI6IjMyMjU0MjE4NCIsImlhdCI6MTY4MzU4MTA5Nn0.zYQYC0fnJ7PntM9bhRXDuQl3wI9UutxwcsRyTnwFpn8');
    console.log(userId)
    const userData = await DAL.FindOne(userMDL, {
      attributes: ["id", "phone", "first_name", "last_name", "team_id"],
      // where: { id: userId }
      where: { id: "322592973" }
    });

    if (!userData) {
      throw "User not found";
    }
    req.user = userData;
    req.body.userId = "322592973";

    return next();
  } catch (err) {
    console.log(`Error in validateAccessToken: ${err}`);

    return responseHandler.unauthorized(res);
  }
};