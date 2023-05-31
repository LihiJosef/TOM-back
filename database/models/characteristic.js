"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Characteristic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Characteristic.hasMany(models.UserCharacteristicRating, {
        foreignKey: "characteristic_id",
        onDelete: "CASCADE"
      });
      Characteristic.hasMany(models.StationCharacteristic, {
        foreignKey: "characteristic_id",
        onDelete: "CASCADE"
      });
    }
  }
  Characteristic.init(
    {      
      name: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      underscored: true,
      sequelize,
      modelName: "Characteristic"
    }
  );
  return Characteristic;
};
