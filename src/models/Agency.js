// src/models/Agency.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Agency = sequelize.define('Agency', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    // 'pending' = aguardando aprovação
    // 'approved' = aprovado
    // 'rejected' = reprovado (opcional)
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'agencies',
  timestamps: true
});

// Antes de criar/salvar, criptografar a senha
Agency.beforeCreate(async (agency, options) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(agency.password, saltRounds);
  agency.password = hashed;
});

module.exports = Agency;
