import bcrypt from "bcrypt";

const hashFromDB = "$2b$10$rlNYj3lz3Bueobt.rNizqOXiuDrkFGOmOx1d0.EGpcJ1IRhAzqfPu";

const run = async () => {
  const result = await bcrypt.compare("Sr!@2501", hashFromDB);
  console.log("Match:", result);
};

run();