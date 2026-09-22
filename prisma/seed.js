const bcrypt = require("bcrypt");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "admin";

  if (!password) {
    throw new Error("ADMIN_PASSWORD belum diatur di .env");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      username,
    },
    update: {},
    create: {
      username,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Seed berhasil!");
  console.log({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
