const express = require("express");
const router = express.Router();
const createUserController = require("../controllers").createUser;
const responseHandler = require("../utilities").responseHandler;

router.post("/", (req, res) => {
  const { email, firstName, lastName, phone, teamId, organization } = req.body.user;
  createUserController
    .createUser({ email, firstName, lastName, phone, teamId, organization })
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      console.log("error in create user");
      console.log(err.message);
      responseHandler.error(res, err, req);
    });
});

module.exports = router;
