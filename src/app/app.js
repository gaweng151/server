const express = require("express");
const cors = require("cors");
const AppError = require("./AppError");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API connected successfully",
  });
});
// initialize routers
app.use("/user", require("../routes/user.routes"));

// middleware error
// Middleware error
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

module.exports = { app };
