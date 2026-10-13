const { execSync } = require("child_process");

console.log("Preparing test database environment (SQLite schema)...");
execSync("npx prisma generate --schema=prisma/schema.sqlite.prisma", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});
// Push the schema into the sqlite file so tables actually exist.
// (Without this the DB stays empty and DB-backed suites fail.)
execSync("npx prisma db push --schema=prisma/schema.sqlite.prisma --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});

let testError = null;
try {
  console.log("Running Jest test suites...");
  execSync("npx jest --runInBand", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./dev.db" },
  });
} catch (err) {
  testError = err;
} finally {
  console.log("Restoring production PostgreSQL Prisma client...");
  try {
    execSync("npx prisma generate --schema=prisma/schema.prisma", {
      stdio: "inherit",
    });
  } catch (postErr) {
    console.error("Warning: could not restore production client:", postErr.message);
  }
}

if (testError) {
  process.exit(1);
}
