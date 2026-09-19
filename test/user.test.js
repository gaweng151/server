const supertest = require("supertest");
const { deleteUser, createUser } = require("./utils");
const { app } = require("../src/app/app");

describe("Login user POST /user/auth/login", () => {
  beforeEach(async () => {
    await createUser();
  });

  afterEach(async () => {
    await deleteUser();
  });

  it("Berhasil Login", async () => {
    const result = await supertest(app).post("/user/auth/login").send({
      username: "test",
      password: "test",
    });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.username).toBe("test");
    expect(result.body.data.password).toBeUndefined();
  });

  it("Gagal Login username salah", async () => {
    const result = await supertest(app).post("/user/auth/login").send({
      username: "test2",
      password: "test",
    });

    expect(result.status).toBe(401);
    expect(result.body.success).toBe(false);
  });
});

describe("Create user POST /user/register", () => {
  beforeEach(async () => {
    await createUser();
  });

  afterEach(async () => {
    await deleteUser();
  });

  it("Berhasil create user", async () => {
    const result = await supertest(app)
      .post("/user/register")
      .send({
        username: "test2",
        password: "test",
        confirmPassword: "test",
        role: "ADMIN",
      })
      .set("Authorization", "test");

    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
  });
});
