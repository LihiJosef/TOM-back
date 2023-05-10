const DAL = require("../DAL");
const userMDL = require("../../database/models").User;

module.exports = {
  async createUser({ email, firstName, lastName, phone, teamId = null, organization }) {
    const newUser = await DAL.Create(userMDL, {
      id: email,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      team_id: teamId,
      organization_id: organization
    });

    return newUser;
  }
};
