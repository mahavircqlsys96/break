const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reviews', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    hostId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    cleanness: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    accuracy: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    checkIn: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    communication: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    location: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    value: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'reviews',
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
        name: "idx_reviews_userId",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "idx_reviews_propertyId",
        using: "BTREE",
        fields: [
          { name: "propertyId" },
        ]
      },
      {
        name: "idx_reviews_hostId",
        using: "BTREE",
        fields: [
          { name: "hostId" },
        ]
      },
    ]
  });
};
