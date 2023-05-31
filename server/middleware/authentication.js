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
  if (!response?.data?.userId) {
    throw "Token is invalid";
  }

  return response.data.userId;
}

module.exports = async (req, res, next) => {
  try {
    const userId = await validateAccessToken(req.headers.authorization);
    const userData = await DAL.FindOne(userMDL, {
      attributes: ["id", "phone", "first_name", "last_name", "team_id", "organization_id"],
      where: { id: userId }
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
