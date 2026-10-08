const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reportUser', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    reporterId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reportedUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Pending','Reviewed','Resolved','Rejected'),
      allowNull: false,
      defaultValue: "Pending"
    }
  }, {
    sequelize,
    tableName: 'reportuser',
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
        name: "idx_reportUser_reporterId",
        using: "BTREE",
        fields: [
          { name: "reporterId" },
        ]
      },
      {
        name: "idx_reportUser_reportedUserId",
        using: "BTREE",
        fields: [
          { name: "reportedUserId" },
        ]
      },
      {
        name: "idx_reportUser_status",
        using: "BTREE",
        fields: [
          { name: "status" },
        ]
      },
    ]
  });
};
