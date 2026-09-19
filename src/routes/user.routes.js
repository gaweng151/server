const router = require("express").Router();
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");

// auth
router.post("/auth/login", controller.login);
router.delete("/auth/logout", auth.access(), controller.logout);

// user
router.get("/", auth.access("ADMIN"), controller.getAll);
router.delete("/:id", auth.access("ADMIN"), controller.deleteUser);
router.patch("/:id", auth.access("ADMIN"), controller.updateUser);
router.get("/me", auth.access(), controller.me);
router.post("/register", auth.access("ADMIN"), controller.register);
module.exports = router;
