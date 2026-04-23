require("dotenv").config();

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME,
    options: {
      serverSelectionTimeoutMS: 5000,
    },
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "esm",
};
