const AppError = require("../app/AppError");
const prisma = require("../app/prisma");

/**
 *
 * @param  {[string]} roles
 * roles = "ADMIN|STAFF"
 *
 * security authentication
 *
 * @returns {void}
 */
const access = (...roles) => {
  if (!roles.length) {
    roles.push("ADMIN", "STAFF");
  }

  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader) {
        throw new AppError(401, "No token provided");
      }

      // Memisahkan "Bearer <token>" jika ada
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      const user = await prisma.user.findFirst({
        where: { token },
        omit: { password: true },
      });

      if (!user) {
        throw new AppError(401, "Unauthorized");
      }

      // Memeriksa role milik user, bukan token-nya
      if (!roles.includes(user.role)) {
        throw new AppError(403, "Access denied");
      }

      req.user = user;
      next();
    } catch (error) {
      next(error); // Salurkan error ke middleware error handler Express
    }
  };
};

module.exports = { access };
