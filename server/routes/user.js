const express = require("express");
const router = express.Router();
const userController = require("../controllers").user;
const responseHandler = require("../utilities").responseHandler;
const { userInfoLimiter, adminUserInfoLimiter } = require("../utilities/").rateLimit;

router.post("/getUserInfo", userInfoLimiter, (req, res) => {
  let appointmentUserId = req.user.id;
  if (userController.isUserAdmin(req.user)) {
    appointmentUserId = req.body.appointmentUserId;
  }

  responseHandler.json(res, { phone: req.user.phone, fullName: `${req.user.first_name} ${req.user.last_name}` });
});

//withput limiter,just for admins
// userInfoLimiter - to-do
router.post("/getUsersNames", adminUserInfoLimiter, (req, res) => {
  const { users } = req.body;
  userController
    .getUsersName(users)
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      responseHandler.error(res, err, req);
    });
});

router.post("/getUserPhone", (req, res) => {
  responseHandler.json(res, { phone: req.user.phone });
});

module.exports = router;
