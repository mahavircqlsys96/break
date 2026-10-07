const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    role: {
      type: DataTypes.ENUM('Admin', 'User', 'Host'),
      allowNull: false,
      defaultValue: "User"
    },
    countryCode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    socialId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    socialType: {
      type: DataTypes.ENUM('Google', 'Apple', 'UAEPass', 'Email'),
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    otpVerify: {
      type: DataTypes.ENUM('no_verify', 'verify'),
      allowNull: false,
      defaultValue: "no_verify"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isNotification: {
      type: DataTypes.ENUM('On', 'Off'),
      allowNull: false,
      defaultValue: "On"
    },
    isLocation: {
      type: DataTypes.ENUM('On', 'Off'),
      allowNull: false,
      defaultValue: "On"
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: "Active"
    },
    socketId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    deviceToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deviceType: {
      type: DataTypes.ENUM('Android', 'iOS', 'Web'),
      allowNull: true
    },
    loginTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    forgotHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image: { type: DataTypes.STRING(500), allowNull: true },
    otpExpiresAt: { type: DataTypes.DATE, allowNull: true },
    otpAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    onboardingStep: {
      type: DataTypes.ENUM('pending', 'profile', 'permissions', 'accountType', 'done'),
      allowNull: false, defaultValue: 'pending'
    },
  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_users_role",
        using: "BTREE",
        fields: [
          { name: "role" },
        ]
      },
      {
        name: "idx_users_phone",
        using: "BTREE",
        fields: [
          { name: "phone" },
        ]
      },
      {
        name: "idx_users_socialId",
        using: "BTREE",
        fields: [
          { name: "socialId" },
        ]
      },
      {
        name: "idx_users_status",
        using: "BTREE",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_users_deletedAt",
        using: "BTREE",
        fields: [
          { name: "deletedAt" },
        ]
      },
    ]
  });
};
