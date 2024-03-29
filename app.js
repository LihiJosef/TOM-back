const environments = require("./server/constants").environments;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = environments.PROD;
}

const sts = require("strict-transport-security");
const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const adminAuth = require("./server/middleware/adminAuth");
const authentication = require("./server/middleware/authentication");

const app = express();
app.disable("x-powered-by");
const STS = sts.getSTS({ "max-age": { days: 10 }, includeSubDomains: true });

if (process.env.NODE_ENV !== environments.LOCAL) {
  app.set("trust proxy", true);
}

app.use(STS);

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true
  })
);

app.use(morgan("dev"));

// healthcheck endpoint
const { checkHealth } = require("./server/utilities").health;
app.get("/", (req, res, next) => {
  const healthcheck = {
    version: process.version, // node version
    // message: "OK",
    timestamp: Date.now()
  };
  const monitor = {
    app: process.env.npm_package_name,
    appVersion: process.env.npm_package_version
  };
  try {
    if (checkHealth()) {
      healthcheck.message = "OK";
      res.send({ monitor, healthcheck }).status(200);
    } else {
      healthcheck.message = "NOT OK";
      res.send({ monitor, healthcheck }).status(500);
    }
  } catch (e) {
    console.error(e);
    healthcheck.message = e;
    res.status(503).send();
  }
});

// This route can be reached from register page without authentication
app.use("/api/organization", require("./server/routes/organization"));
app.use("/api/register", require("./server/routes/register"));
app.use("/api/login", require("./server/routes/login"));

// protect routes from here
app.use("/", authentication);

// Routes -'/api/..'
app.use("/api/user", require("./server/routes/user"));
app.use("/api/complex", require("./server/routes/complex"));
app.use("/api/disableStation", require("./server/routes/disabledStation"));
// app.use("/api/organization", require("./server/routes/organization"));
app.use("/api/appointment", require("./server/routes/appointment"));
app.use("/api/station", require("./server/routes/station"));
app.use("/api/schedule", adminAuth, require("./server/routes/admin"));
app.use("/api/deleteAppointments", require("./server/routes/deleteAppointments"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") !== environments.PROD ? err : {};

  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
