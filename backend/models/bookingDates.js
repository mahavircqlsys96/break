const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bookingDates', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'bookingdates',
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
        name: "unique_booking_date",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "bookingId" },
          { name: "date" },
        ]
      },
      {
        name: "idx_bookingDates_date",
        using: "BTREE",
        fields: [
          { name: "date" },
        ]
      },
      {
        name: "idx_bookingDates_bookingId",
        using: "BTREE",
        fields: [
          { name: "bookingId" },
        ]
      },
    ]
  });
};
