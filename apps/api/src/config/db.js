const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

//? IN OTHER FILES, USE `const prisma = require("../config/db")` OR SIMILAR RELATIVE FILEPATH TO IMPORT PRISMA OBJECT FROM THIS FILE
module.exports = prisma;
