// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
const dbDialect = process.env.DB_DIALECT; // ex: 'mysql'
const dbPort = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: dbDialect,
  port: dbPort,
  // opcional: define configurações de pool e logging
  logging: console.log, // pode ser false para não exibir logs
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
