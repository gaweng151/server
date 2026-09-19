const AppError = require("../app/AppError");
const bcrypt = require("bcrypt");
const prisma = require("../app/prisma");
// const { v4: uuid } = require("uuid");

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !String(username).trim()) {
      throw new AppError(400, "Username must not be empty");
    }

    if (password === undefined || password === null || password === "") {
      throw new AppError(400, "Password must not be empty");
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    if (cleanUsername.length < 3) {
      throw new AppError(400, "Username minimum 3 characters");
    }

    if (cleanPassword.length < 4) {
      throw new AppError(400, "Password minimum 4 characters");
    }

    if (cleanPassword.length > 10) {
      throw new AppError(400, "Password maximum 10 characters");
    }

    const user = await prisma.user.findUnique({
      where: {
        username: cleanUsername,
      },
    });

    if (!user) {
      throw new AppError(401, "Incorrect username and password");
    }

    const validPw = await bcrypt.compare(cleanPassword, user.password);

    if (!validPw) {
      throw new AppError(401, "Incorrect username and password");
    }

    const token = crypto.randomUUID();

    const data = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: { token },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Successfully logged in",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: {
        id: Number(req.user.id),
      },
      data: {
        token: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const me = async (req, res, next) => {
  try {
    // req.user didapat langsung dari middleware access
    res.status(200).json({
      success: true,
      message: "Successfully retrieved profile",
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const register = async (req, res, next) => {
  try {
    const { username, password, confirmPassword, role } = req.body;

    // 1. Validasi Keberadaan Field (Required Check)
    if (!username) throw new AppError(400, "Username is required");
    if (!password) throw new AppError(400, "Password is required");
    if (!confirmPassword)
      throw new AppError(400, "Confirm password is required");

    // Clean String
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();
    const cleanConfirmPassword = String(confirmPassword).trim();

    // 2. Validasi Panjang Username (Misal: 3 - 20 Karakter)
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      throw new AppError(400, "Username must be between 3 and 20 characters");
    }

    // 3. Validasi Format Username (Hanya Huruf, Angka, Underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      throw new AppError(
        400,
        "Username can only contain letters, numbers, and underscores",
      );
    }

    // 4. Validasi Panjang Password (Misal: 6 - 20 Karakter)
    if (cleanPassword.length < 4 || cleanPassword.length > 20) {
      throw new AppError(400, "Password must be between 6 and 20 characters");
    }

    // 5. Validasi Kesesuaian Password & Confirm Password
    if (cleanPassword !== cleanConfirmPassword) {
      throw new AppError(400, "Password and confirm password do not match");
    }

    // 6. Validasi Role (Daftar Role yang Diizinkan)
    const allowedRoles = ["ADMIN", "STAFF"];
    // Set default role jika tidak diisi, misal "USER"
    const userRole = role ? String(role).toUpperCase().trim() : "USER";

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(
        400,
        `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
      );
    }

    // 7. Cek Apakah Username Sudah Terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser) {
      throw new AppError(400, "Username is already taken");
    }

    // 8. Hash Password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // 9. Simpan User Baru ke Database
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User successfully registered",
      data: newUser,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const count = await prisma.user.count({
      where: {
        id,
      },
    });

    if (count === 0) {
      throw new AppError(404, "User not found");
    }

    const deleted = await prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
      select: {
        username: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `User "${deleted.username}" has been successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const getAll = async (req, res, next) => {
  try {
    const { search = "" } = req.query;

    const users = await prisma.user.findMany({
      where: {
        username: { contains: search },
      },
      omit: {
        password: true,
      },
    });

    res.status(201).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NexFunction} next
 */
const updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isForget = false, password, confirmPassword, role } = req.body;

    // 1. Cek apakah ID valid
    if (isNaN(id)) {
      throw new AppError(400, "Invalid user ID format");
    }

    // 2. Cek keberadaan user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const updateData = {};

    // 3. Logika Reset / Ganti Password (isForget === true)
    if (isForget) {
      if (!password) throw new AppError(400, "Password is required");
      if (!confirmPassword)
        throw new AppError(400, "Confirm password is required");

      const cleanPassword = String(password).trim();
      const cleanConfirmPassword = String(confirmPassword).trim();

      if (cleanPassword.length < 6 || cleanPassword.length > 20) {
        throw new AppError(400, "Password must be between 6 and 20 characters");
      }

      if (cleanPassword !== cleanConfirmPassword) {
        throw new AppError(400, "Password and confirm password do not match");
      }

      // Hash password baru
      updateData.password = await bcrypt.hash(cleanPassword, 10);
    }

    // 4. Logika Update Role (Opsional)
    if (role) {
      const allowedRoles = ["ADMIN", "STAFF", "USER"];
      const cleanRole = String(role).toUpperCase().trim();

      if (!allowedRoles.includes(cleanRole)) {
        throw new AppError(
          400,
          `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
        );
      }

      updateData.role = cleanRole;
    }

    // 5. Cek apakah ada data yang diubah
    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, "No fields provided to update");
    }

    // 6. Update user di database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "User successfully updated",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  me,
  register,
  deleteUser,
  getAll,
  updateUser,
};
