const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('promoCodes', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    minBookingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    usageLimit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    usedCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    }
  }, {
    sequelize,
    tableName: 'promoCodes',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }]
      },
      {
        name: "idx_promoCodes_code",
        unique: true,
        using: "BTREE",
        fields: [{ name: "code" }]
      },
      {
        name: "idx_promoCodes_status",
        using: "BTREE",
        fields: [{ name: "status" }]
      }
    ]
  });
};

