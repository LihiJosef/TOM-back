const DAL = require("../DAL");
const userMDL = require("../../database/models").User;

module.exports = {
  async createUser({ id, firstName, lastName, phone, teamId = null, organization }) {
    const newUser = await DAL.Create(userMDL, {
      id: id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      team_id: teamId,
      organization_id: organization
    });

    return newUser;
  }
};
