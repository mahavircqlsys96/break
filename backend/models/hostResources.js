const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('hostResources', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Hosting resources'
    },
    subtitle: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    readTime: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '3 min read'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'BookOpen'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    }
  }, {
    sequelize,
    tableName: 'hostResources',
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
        name: "idx_hostResources_type",
        using: "BTREE",
        fields: [
          { name: "type" },
        ]
      },
      {
        name: "idx_hostResources_status",
        using: "BTREE",
        fields: [
          { name: "status" },
        ]
      }
    ]
  });
};
