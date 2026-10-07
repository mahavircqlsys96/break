const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('properties', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    hostId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    basicInfo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    propertyTypeId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'propertyTypes',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      defaultValue: 0.00
    },
    bedroom: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    bathroom: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    guest: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Active','Inactive'),
      allowNull: false,
      defaultValue: "Active"
    }
  }, {
    sequelize,
    tableName: 'properties',
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
        name: "idx_properties_hostId",
        using: "BTREE",
        fields: [
          { name: "hostId" },
        ]
      },
      {
        name: "idx_properties_propertyTypeId",
        using: "BTREE",
        fields: [
          { name: "propertyTypeId" },
        ]
      },
      {
        name: "idx_properties_location",
        using: "BTREE",
        fields: [
          { name: "latitude" },
          { name: "longitude" },
        ]
      },
      {
        name: "idx_properties_price",
        using: "BTREE",
        fields: [
          { name: "price" },
        ]
      },
      {
        name: "idx_properties_status",
        using: "BTREE",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_properties_deletedAt",
        using: "BTREE",
        fields: [
          { name: "deletedAt" },
        ]
      },
    ]
  });
};
