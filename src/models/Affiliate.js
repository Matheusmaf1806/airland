// src/models/Affiliate.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Affiliate = sequelize.define('Affiliate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  logo_url: {
    type: DataTypes.TEXT
  },
  primary_color: {
    type: DataTypes.STRING
  },
  secondary_color: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'affiliates', // nome da tabela no banco
  timestamps: true
});

module.exports = Affiliate;
