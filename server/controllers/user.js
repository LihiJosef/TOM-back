const DAL = require("../DAL");
const { Sequelize, Op } = require("sequelize");
const HttpError = require("../utilities").HttpError;
const userMDL = require("../../database/models").User;
const { trackException } = require("../utilities/logs");
const { isNullOrUndefinedOrEmpty } = require("../helpers");
const adminMDL = require("../../database/models").Complex_Admin;
const { customResErrors } = require("../constants").customError;

const USER_UNKNOWN_NAME = "לא הוזן";

const userExists = async userId => {
  return await DAL.FindOne(userMDL, {
    attributes: ["id", "phone", "first_name", "last_name"],
    where: { id: userId }
  });
};

const usersName = async userIdArr => {
  return await DAL.Find(userMDL, {
    attributes: ["id", "first_name", "last_name"],
    raw: true,
    where: {
      id: userIdArr
    }
  });
};
const createUser = async user => {
  await DAL.Create(userMDL, user);
};

const getUserFullName = ({ first_name, last_name }) => {
  if (isNullOrUndefinedOrEmpty(first_name, last_name)) return USER_UNKNOWN_NAME;
  return `${first_name} ${last_name}`;
};

module.exports = {
  async isUserAdmin(userId) {
    if (!userId) {
      throw new HttpError({ error: customResErrors.parametersValidation });
    }

    const user = await DAL.Find(adminMDL, {
      attributes: ["user_id", "complex_id"],
      raw: true,
      where: { user_id: userId }
    });

    if (user) {
      const complexesId = user.map(i => i.complex_id);
      return { isAdmin: true, complexesId: complexesId };
    }

    return { isAdmin: false, complexId: null };
  },

  async getUsersName(userIdArr) {
    const usersFirstLastName = await usersName(userIdArr);
    const fullNames = usersFirstLastName.map(user => {
      return {
        id: user.id,
        fullName: user.first_name + " " + user.last_name
      };
    });
    return fullNames;
  },

  async deleteUsers(transaction) {
    await DAL.Delete(userMDL, {
      where: {
        id: { [Op.notIn]: Sequelize.literal(`(SELECT "user_id" FROM "Appointment")`) }
      },
      transaction
    });
  }
};
