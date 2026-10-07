const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notifications', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receivedId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notificationType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requestId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    isRead: {
      type: DataTypes.ENUM('yes','no'),
      allowNull: false,
      defaultValue: "no"
    }
  }, {
    sequelize,
    tableName: 'notifications',
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
        name: "idx_notifications_receivedId",
        using: "BTREE",
        fields: [
          { name: "receivedId" },
        ]
      },
      {
        name: "idx_notifications_senderId",
        using: "BTREE",
        fields: [
          { name: "senderId" },
        ]
      },
      {
        name: "idx_notifications_isRead",
        using: "BTREE",
        fields: [
          { name: "isRead" },
        ]
      },
      {
        name: "idx_notifications_requestId",
        using: "BTREE",
        fields: [
          { name: "requestId" },
        ]
      },
    ]
  });
};
