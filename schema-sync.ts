import { sequelize } from "./src/infrastructure/persistence/sequelize/client";
(async() => {
  await sequelize.sync({ alter: true });
  console.log("Database models synchronized!");
  process.exit(0);
})().catch(e => {
  console.error("SYNC ERROR:", e);
  process.exit(1);
});
