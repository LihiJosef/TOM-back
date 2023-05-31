const express = require("express");
const router = express.Router();
const createUserController = require("../controllers").createUser;
const responseHandler = require("../utilities").responseHandler;

router.post("/createUser", (req, res) => {
  const { email, firstName, lastName, phone, teamId, organization, password } = req.body;
  createUserController
    .createUser({ email, firstName, lastName, phone, teamId, organization, password })
    .then(data => res.json(res, data))
    .catch(err => {
      console.log("error in create user");
      console.log(err.message);
      responseHandler.error(res, err, req);
    });
});

module.exports = router;
