"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StationCharacteristic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StationCharacteristic.belongsTo(models.Station, {
        foreignKey: "station_id"
      });

      StationCharacteristic.belongsTo(models.Characteristic, {
        foreignKey: "characteristic_id"
      });
    }
  }
  StationCharacteristic.init(
    {
      station_id: DataTypes.INTEGER,
      characteristic_id: DataTypes.INTEGER,
    },
    {
      freezeTableName: true,
      underscored: true,
      sequelize,
      modelName: "StationCharacteristic"
    }
  );
  return StationCharacteristic;
};
