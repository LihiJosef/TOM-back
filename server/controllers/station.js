// utilities & helpers
const DAL = require("../DAL");
const moment = require("moment");
const Op = require("../../database/models").Sequelize.Op;
const sequelize = require("../../database/models").sequelize;
const Sequelize = require("sequelize");
const { QueryTypes, INTEGER } = require("sequelize");
const HttpError = require("../utilities").HttpError;
const { isNullOrUndefinedOrEmpty, isNotObject } = require("../helpers");
const {
  deleteDisables,
  createDisables,
  getStationDisables,
  getCurrentDisabledStations,
  getPermanentlyDisabledStations
} = require("./disabledStation");
const { trackEvent, trackException } = require("../utilities/logs");
const { getStationInterval } = require("../utilities/station");
const user = require("./user");
// models
const stationMDL = require("../../database/models").Station;
const stationTypeMDL = require("../../database/models").StationType;
const appointmentMDL = require("../../database/models").Appointment;

// constants
const appointmentStatuses = require("../constants").appointmentStatuses;
const { customResErrors } = require("../constants").customError;

const getStationById = async stationId => {
  return await DAL.FindByPk(stationMDL, stationId);
};

// FUNCTION TO ACTUALLY CHOOSE THE STATION
const chooseBestStation = async ({
  user,
  unavailableStations,
  stationId,
  appointmentDatetime,
  complexId,
  stationTypeId
}) => {
  const idFilter = unavailableStations?.length > 0 ? [{ id: { [Op.notIn]: unavailableStations } }] : [];

  if (stationId) {
    idFilter.push({ id: stationId });
  }

  const availableStations = await DAL.Find(stationMDL, {
    raw: true,
    // attributes: ["id", "name"],
    distinct: ["id"],
    where: {
      station_type_id: stationTypeId,
      complex_id: complexId,
      [Op.and]: idFilter
    }
  });
  let availableStation;

  // if its a personal work station - seating algorithm is executed 
  if(stationTypeId == 3) {
    availableStation = await seatingAlgo({user, availableStations, appointmentDatetime, complexId});
  } else {
    availableStation = availableStations[0];
  }


  if (!stationId) {
    const userPreviousStationThatDay = await DAL.FindOne(appointmentMDL, {
      raw: true,
      attributes: ["station_id"],
      where: {
        status_id: appointmentStatuses.ACTIVE,
        start_datetime: {
          [Op.between]: [
            moment(appointmentDatetime[0]).utc().tz("Israel").startOf("day"),
            moment(appointmentDatetime[0]).utc().tz("Israel").endOf("day")
          ]
        }
      }
    });

    if (userPreviousStationThatDay && userPreviousStationThatDay.length > 0) {
      const userPrevStationThatDay = availableStations.find(
        st => st.id === userPreviousStationThatDay.station_id
      );
      if (userPrevStationThatDay) {
        availableStation = userPrevStationThatDay;
      }
    }
  }
  return availableStation;
};

const seatingAlgo = async ({user, availableStations, appointmentDatetime, complexId}) => {
  const teamStations = await checkForTeamAppointments({user, appointmentDatetime, complexId});
  if(teamStations.length) {
    let filteredCloseStations = [];
    // filtering and adding only stations close to the team
    for (const station of availableStations) {
      let currAmt = 0;
      for (const teamStation of teamStations) {
        if(station.floor == teamStation.floor) {
          const distance = Math.sqrt(Math.pow(station.x - teamStation.x,2) + Math.pow(station.y - teamStation.y,2));

          // checking if dsitance is close enough
          if(distance < 5) {
            currAmt++;
          }
        }
      }
      // adding the station and how many stations it is close to
        filteredCloseStations.push({...station, amount: currAmt});
    }
    // sorting array to be descending by how many stations they're close to
    filteredCloseStations.sort((a,b) => b.amount - a.amount);
    availableStations = filteredCloseStations;
  } 
  // TODO: CALCULATE USER'S RATE FOR EACH AVILABLE STATION
  for (const station of availableStations) {
    const currRating = await calculateStationRating({stationId: station.id, userId: user.id});
    // if amount exsits, which means there are stations close to team, weight the amount
    if (station.amount == undefined || station.amount == null) {
      station.rating = currRating;
    } else {
      const weightedRating = 0.7 * station.amount + 0.3 * currRating;
      station.rating = weightedRating;
    }
  }
  // order stations by their rating from best to worst
  availableStations.sort((a,b) => b.rating - a.rating);
  return availableStations[0];
}

const checkForTeamAppointments = async ({user, appointmentDatetime, complexId}) => {
  // TODO: GET ALL USERS IN THE TEAM OF THE CURRENT USER
  // TODO: MAKE A DB QUERY FOR ALL STATIONS WITH APPOINTMENTS ON THESE HOURS WHO ARE FOR PEOPLE IN THE USER'S TEAM
  try {
    const QUERY = `SELECT station.id, station.x, station.y, station.floor 
                  FROM "Appointment" apt, "User" teamUsers, "Station" station, "User" me
                  WHERE apt.user_id = teamUsers.id
                        AND station.station_type_id = 3
                        AND me.id = '${user.id}'
                        AND me.team_id = teamUsers.team_id
                        AND (apt.start_datetime BETWEEN '${appointmentDatetime[0]}' AND '${appointmentDatetime[appointmentDatetime.length - 1]}')
                        AND station.id = apt.station_id
                        AND station.complex_id = ${complexId}`;

    const res = await sequelize.query(QUERY, {
      type: QueryTypes.SELECT
    });

    return res;
  } catch (err) {
    trackException(err, { name: "cant get appointment's stations of team" });

    throw err;
  }
}

const calculateStationRating = async ({stationId, userId}) => {
  try {
    const characteristicsQuery = `SELECT char.id
                  FROM "Characteristic" char, "StationCharacteristic" stationChar
                  WHERE stationChar.station_id = ${stationId}
                        AND stationChar.characteristic_id = char.id`;

    const characteristics = await sequelize.query(characteristicsQuery, {
      type: QueryTypes.SELECT
    });
    let ratingSum = 0;
    let ratingCount = 0;
    for (const char of characteristics) {
      const ratingQuery = `SELECT rating_avg
                    FROM "UserCharacteristicRating"
                    WHERE user_id = '${userId}'
                          AND characteristic_id = ${char.id}`;

      const rating = await sequelize.query(ratingQuery, {
      type: QueryTypes.SELECT
      });

      if (rating.length) {
        ratingSum += rating[0].rating_avg;
        ratingCount++;
      }
    }
    let finalRatingAvg;
    if (ratingCount) {
      finalRatingAvg = ratingSum / ratingCount;
    } else {
      finalRatingAvg = 2.5;
    }

    return finalRatingAvg;
  } catch (err) {
    trackException(err, { name: "cant get appointment's stations of team" });

    throw err;
  }
}

const getUnavailableStations = async ({ stationTypeId, complexId, appointmentDatetime }) => {
  const disabledStations = await getCurrentDisabledStations(complexId, stationTypeId, appointmentDatetime);

  const UNAVAILABLE_OPTIONS = {
    raw: true,
    attributes: ["station_id"],
    where: {
      status_id: appointmentStatuses.ACTIVE,
      start_datetime: { [Op.in]: appointmentDatetime }
    }
  };

  const takenStations = await DAL.Find(appointmentMDL, UNAVAILABLE_OPTIONS);
  trackEvent("unavailable stations", {
    ids: takenStations,
    disabledStations,
    function: "getAvailableStation"
  });

  const unavailableAndDisableStations = [...takenStations.map(st => st.station_id), ...disabledStations];

  return unavailableAndDisableStations;
};

module.exports = {
  async getAssignIntervalByStationType(stationTypeId) {
    return await getStationInterval(stationTypeId);
  },

  // THIS IS MAIN FUNCTION TO FIND STATION !!!
  async getAvailableStation({ user, stationTypeId, complexId, appointmentDatetime, stationId }) {
    const unavailableStations = await getUnavailableStations({
      stationTypeId,
      complexId,
      appointmentDatetime
    });
    const bestStation = await chooseBestStation({
      user,
      unavailableStations,
      stationId,
      appointmentDatetime,
      complexId,
      stationTypeId
    });

    trackEvent("available station", { ids: bestStation, function: "getAvailableStation" });

    if (!isNullOrUndefinedOrEmpty(bestStation)) return bestStation;

    return null;
  },

  async getStationTypeNameByStationId(stationId) {
    return await DAL.FindOne(stationMDL, {
      attributes: [[Sequelize.col(`"StationType"."name"`), "name"]],
      raw: true,
      where: { id: stationId },
      include: { model: stationTypeMDL, attributes: [] }
    });
  },

  async getAllStations(complexId) {
    const where = {};
    if (complexId) {
      where.complex_id = complexId;
    }

    return await DAL.Find(stationMDL, {
      attributes: ["id", "station_type_id", "name"],
      raw: true,
      where: where,
      include: { model: stationTypeMDL, attributes: ["name", "assignment_minute_interval"] }
    });
  },

  async getAvailableStationsTypes(complexId) {
    if (isNullOrUndefinedOrEmpty(complexId)) {
      throw new HttpError({ error: customResErrors.parametersValidation });
    }
    const disabledStations = await getPermanentlyDisabledStations(complexId);
    try {
      const QUERY = `SELECT id, name 
                    FROM "StationType" stp 
                    WHERE EXISTS (SELECT null
                                  FROM "Station"
                                  WHERE station_type_id = stp.id
                                    AND complex_id = $complexId 
    ${disabledStations?.length > 0 ? `AND id NOT IN (${disabledStations})` : ""})`;

      const res = await sequelize.query(QUERY, {
        bind: { complexId },
        type: QueryTypes.SELECT
      });

      return res;
    } catch (err) {
      trackException(err, { name: "cant get available station types", complexId });

      throw err;
    }
  },

  async isValidStation(stationId, complexId) {
    if (isNullOrUndefinedOrEmpty(stationId)) {
      throw new HttpError({ error: customResErrors.parametersValidation });
    }

    const isExists = await DAL.FindOne(stationMDL, {
      raw: true,
      where: { id: stationId, ...(complexId && { complex_id: complexId }) }
    });

    return isExists !== null;
  },

  async updateStationById({ stationId, newDataObj, returning, transaction }) {
    if (isNullOrUndefinedOrEmpty(stationId) || isNotObject(newDataObj)) {
      throw new HttpError({ error: customResErrors.parametersValidation });
    }

    const [amountRecords, infoRecordsUpdated] = await DAL.Update(stationMDL, newDataObj, {
      returning,
      transaction,
      where: { id: stationId }
    });

    if (!amountRecords || !infoRecordsUpdated?.length) {
      throw new HttpError({ error: customResErrors.notFound });
    }

    return amountRecords === 1 ? infoRecordsUpdated[0] : { infoRecordsUpdated };
  },
  async handleDeleteDisables(deletedDisables, transaction) {
    if (deletedDisables?.length > 0) {
      await deleteDisables(deletedDisables, transaction);
    }
  },
  async handleCreateDisables(stationId, newDisables, transaction) {
    if (newDisables?.length > 0) {
      const stationData = await getStationById(stationId);

      const formattedData = newDisables.map(disable => {
        return {
          ...disable,
          station_id: stationId,
          complex_id: stationData.complex_id,
          station_type_id: stationData.station_type_id
        };
      });
      await createDisables(formattedData, transaction);

      const allStationDisables = [...(await getStationDisables(stationId)), ...formattedData];

      trackEvent("about to cancel appointments", { stationId });

      await require("./appointment").cancelAppointmentsByDisables({
        stationId,
        transaction,
        allStationDisables,
        statusId: appointmentStatuses.CANCELLED_BY_NON_ACTIVE_STATION
      });
    }
  },
  async setStationActivityById({ newDisables, deletedDisables, stationId }) {
    if (!(await this.isValidStation(stationId))) {
      throw new HttpError({ error: customResErrors.badRequest });
    }

    const transaction = await sequelize.transaction();
    try {
      await Promise.all([
        this.handleDeleteDisables(deletedDisables, transaction),
        this.handleCreateDisables(stationId, newDisables, transaction)
      ]);

      return await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      trackException(error, { name: "updating station activity failed" });
      throw error;
    }
  },

  async getStationsByTypeAndComplex(complexId, stationTypeId) {
    if (isNullOrUndefinedOrEmpty(complexId, stationTypeId)) {
      throw new HttpError({ error: customResErrors.parametersValidation });
    }

    return await DAL.Find(stationMDL, {
      attributes: ["id"],
      raw: true,
      where: { complex_id: complexId, station_type_id: stationTypeId }
    });
  }
};
