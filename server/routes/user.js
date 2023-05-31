const express = require("express");
const router = express.Router();
const userController = require("../controllers").user;
const responseHandler = require("../utilities").responseHandler;

router.post("/getUserInfo", (req, res) => {
  let appointmentUserId = req.user.id;
  if (userController.isUserAdmin(req.user)) {
    appointmentUserId = req.body.appointmentUserId;
  }

  responseHandler.json(res, {
    phone: req.user.phone,
    fullName: `${req.user.first_name} ${req.user.last_name}`
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

router.post("/getUserData" , (req, res) => {
  responseHandler.json(res, req.user);
});

module.exports = router;
