const prisma = require("../src/app/prisma");

const bcrypt = require("bcrypt");

const createUser = async () => {
  await prisma.user.create({
    data: {
      username: "test",
      password: await bcrypt.hash("test", 10),
      role: "ADMIN",
      token: "test",
    },
  });
  ("");
};

const deleteUser = async () => {
  await prisma.user.deleteMany({
    where: {
      username: "test",
      OR: [{ username: "test" }, { username: "test2" }],
    },
  });
};

module.exports = { createUser, deleteUser };
