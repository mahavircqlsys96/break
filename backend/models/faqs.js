const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('faqs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    question: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Bookings & guests'
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'General'
    },
    targetAudience: {
      type: DataTypes.ENUM('Host', 'Guest', 'All'),
      allowNull: false,
      defaultValue: 'Host'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
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
    tableName: 'faqs',
    timestamps: true,
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
        name: "idx_faqs_category",
        using: "BTREE",
        fields: [
          { name: "category" }
        ]
      },
      {
        name: "idx_faqs_status",
        using: "BTREE",
        fields: [
          { name: "status" }
        ]
      }
    ]
  });
};
