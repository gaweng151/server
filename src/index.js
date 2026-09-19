require("dotenv").config();
const { app } = require("./app/app");

const PORT = process.env.PORT || 8080;

app.listen(() => {
  console.log(`App running on port: `, PORT);
});
