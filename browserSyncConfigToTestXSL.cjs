module.exports = {
  server: {
    baseDir: "publish",
    middleware: function (req, res, next) {
      if (req.url.endsWith(".xml")) {
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("x-content-type-options", "nosniff");
      }
      next();
    },
  },
  files: ["publish/**/*"],
  open: true,
};
