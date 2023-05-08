
module.exports = {
  trackException: (exception, properties = null) => {
    console.log(exception, properties);
  },
  trackEvent: (name, properties = null) => {
    console.log(name, properties);
  }
};
