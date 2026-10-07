const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('propertiesKeyAmenities', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    amenitiesId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'amenities',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'propertiesKeyAmenities',
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
        name: "unique_property_amenity",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "propertyId" },
          { name: "amenitiesId" },
        ]
      },
      {
        name: "idx_propertyAmenities_propertyId",
        using: "BTREE",
        fields: [
          { name: "propertyId" },
        ]
      },
      {
        name: "idx_propertyAmenities_amenitiesId",
        using: "BTREE",
        fields: [
          { name: "amenitiesId" },
        ]
      },
    ]
  });
};
