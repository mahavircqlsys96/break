const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('chatRoom', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'bookings',
        key: 'id'
      }
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
    lastMsgId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'chatRoom',
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
        name: "idx_chatRoom_bookingId",
        using: "BTREE",
        fields: [
          { name: "bookingId" },
        ]
      },
      {
        name: "idx_chatRoom_senderId",
        using: "BTREE",
        fields: [
          { name: "senderId" },
        ]
      },
      {
        name: "idx_chatRoom_receiverId",
        using: "BTREE",
        fields: [
          { name: "receiverId" },
        ]
      },
      {
        name: "fk_chatRoom_lastMsg",
        using: "BTREE",
        fields: [
          { name: "lastMsgId" },
        ]
      },
    ]
  });
};
