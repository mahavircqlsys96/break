const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('messages', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    roomId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'chatRoom',
        key: 'id'
      }
    },
    bookingId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    messageType: {
      type: DataTypes.BLOB,
      allowNull: false,
      defaultValue: "text"
    }
  }, {
    sequelize,
    tableName: 'messages',
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
        name: "idx_messages_senderId",
        using: "BTREE",
        fields: [
          { name: "senderId" },
        ]
      },
      {
        name: "idx_messages_receiverId",
        using: "BTREE",
        fields: [
          { name: "receiverId" },
        ]
      },
      {
        name: "idx_messages_roomId",
        using: "BTREE",
        fields: [
          { name: "roomId" },
        ]
      },
      {
        name: "idx_messages_bookingId",
        using: "BTREE",
        fields: [
          { name: "bookingId" },
        ]
      },
      {
        name: "idx_messages_createdAt",
        using: "BTREE",
        fields: [
          { name: "createdAt" },
        ]
      },
    ]
  });
};
