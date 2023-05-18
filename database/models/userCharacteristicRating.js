"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class userCharacteristicRating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      userCharacteristicRating.belongsTo(models.User, {
        foreignKey: "user_id"
      });

      userCharacteristicRating.belongsTo(models.Characteristic, {
        foreignKey: "characteristic_id"
      });
    }
  }
  userCharacteristicRating.init(
    {
      user_id: DataTypes.STRING(9),
      characteristic_id: DataTypes.INTEGER,
      rating_avg: DataTypes.FLOAT,
      rate_times: DataTypes.INTEGER
    },
    {
      freezeTableName: true,
      underscored: true,
      sequelize,
      modelName: "UserCharacteristicRating"
    }
  );
  return userCharacteristicRating;
};
