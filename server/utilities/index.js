const AppointmentService = require("./appointment");
const health = require("./health");
const HttpError = require("./httpError");
const msGraph = require("./msGraph");
const responseHandler = require("./responseHandler");

module.exports = {
  AppointmentService,
  health,
  HttpError,
  msGraph,
  responseHandler,
};
