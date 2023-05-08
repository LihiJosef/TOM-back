const { isNullOrUndefinedOrEmpty } = require("../helpers");

const validateUserId = userId => {
  if (typeof userId !== "string" || userId.length > 9 || !userId.match(/^\d{9}$/)) {
    return false;
  }
  return true;
};

const validatePhone = phone => {
  if (typeof phone !== "string" || phone.length > 10 || !phone.match(/^05\d{8}$/)) {
    return false;
  }
  return true;
};
const validateUserInfo = async ({ userId, fullName, phone }) => {
  if (isNullOrUndefinedOrEmpty(userId, fullName, phone) || !validatePhone(phone) || !validateUserId(userId)) {
    console.table({ userId, fullName, phone });
    throw new HttpError({
      error: customResErrors.parametersValidation,
      params: { userId, fullName, phone }
    });
  }
  return;
};

const validateUser = async userId => {
  if (isNullOrUndefinedOrEmpty(userId) || !validateUserId(userId)) {
    throw new HttpError({ error: customResErrors.parametersValidation });
  }
};

module.exports = { validateUserId, validatePhone, validateUserInfo, validateUser };
