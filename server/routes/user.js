const express = require("express");
const { appointment } = require("../controllers");
const router = express.Router();
const userController = require("../controllers").user;
const responseHandler = require("../utilities").responseHandler;

router.post("/getUserInfo", (req, res) => {
  let appointmentUserId = req.body.userId;
  if (userController.isUserAdmin(req.user)) {
    appointmentUserId = req.body.appointmentUserId;
  }

  userController
    .getUserInfo(appointmentUserId)
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      responseHandler.error(res, err, req);
    });
});

router.post("/getUsersNames", (req, res) => {
  const { users } = req.body;
  userController
    .getUsersName(users)
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      responseHandler.error(res, err, req);
    });
});

router.post("/getUserPhone", (req, res) => {
  const { userId } = req.body;
  userController
    .getUserPhone(userId)
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      responseHandler.error(res, err, req);
    });
});

router.post("/getServiceType", (req, res) => {
  const { userId } = req.body;
  userController
    .getServiceType(userId)
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      responseHandler.error(res, err, req);
    });
});

module.exports = router;
