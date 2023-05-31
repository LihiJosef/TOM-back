const DAL = require("../DAL");
const userMDL = require("../../database/models").User;
const axios = require("axios");

module.exports = {
  async createUser({ email, firstName, lastName, phone, teamId = null, organization, password }) {
    await DAL.Create(userMDL, {
      id: email,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      team_id: teamId,
      organization_id: organization
    });

    const response = await axios.post(process.env.AUTH_API + "/passwords/new", { userId: email, password: password });
    if (!response?.data?.token) {
      throw "Token is invalid";
    }

    return response.data;
  }
};
