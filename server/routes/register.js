const express = require("express");
const router = express.Router();
const createUserController = require("../controllers").createUser;
const responseHandler = require("../utilities").responseHandler;

router.post("/createUser", (req, res) => {
  const { id, firstName, lastName, phone, teamId, organization, password } = req.body;
  createUserController
    .createUser({ id, firstName, lastName, phone, teamId, organization, password })
    .then(data => responseHandler.json(res, data))
    .catch(err => {
      console.log("error in create user");
      console.log(err.message);
      responseHandler.error(res, err, req);
    });
});

module.exports = router;
