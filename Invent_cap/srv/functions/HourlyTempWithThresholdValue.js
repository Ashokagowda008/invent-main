const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const { filterPeriodWiseData } = require('../formatter/formatter');

async function calcHourlyTempWithThresholdValue(req) {


    let [year, plantId, EquipmentTypeid, period, meterId, filterDate] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period, req.data.meterId, req.data.filterDate];
    let sensortype = "temperature";
    let conditions = [];
    let query = "";
    if (year) {
        conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${year}`);
    }
    if (period) {
        let monthRange = await filterPeriodWiseData(period);
        conditions.push(`EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Data.timestamp) >= ${monthRange.startMonth} AND EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Data.timestamp) <=${monthRange.endMonth}`);
    }
    if (filterDate) {
        let [yearfilter, monthfilter, dayfilter] = [new Date(filterDate).getUTCFullYear(), new Date(filterDate).getUTCMonth() + 1, new Date(filterDate).getUTCDate()];
        conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${yearfilter}
           AND MONTH(sustainabilitymanagement_Sensor_Data.timestamp) = ${monthfilter}
           AND DAY(sustainabilitymanagement_Sensor_Data.timestamp) = ${dayfilter}`)
    }
    if (plantId) {
        conditions.push(`sustainabilitymanagement_Sensor_Register.plant_id = '${plantId}'`);
    }
    if (meterId) {
        conditions.push(`sustainabilitymanagement_Sensor_Data.sensor_id = '${meterId}'`);
    }
    if (EquipmentTypeid) {
        conditions.push(`sustainabilitymanagement_Sensor_Register.equipment_type_id = '${EquipmentTypeid}'`);
    }
    if (sensortype) {
        conditions.push(`sustainabilitymanagement_Sensor_Register.type_id = '${sensortype}'`);
    }
    if (conditions.length) {
        query += conditions.join(` AND `);
    }
    const tx = cds.transaction()
    let tempWithThresholdValue = {};
    let [hourlyData] = await Promise.all([tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns('sustainabilitymanagement_Sensor_Data.sensor_id As SensorId', "TO_VARCHAR(sustainabilitymanagement_Sensor_Data.timestamp , 'dd-MM HH24:MI') As period", 'sustainabilitymanagement_Sensor_Data.reading AS HourlyTemp', 'sustainabilitymanagement_Sensor_Register.lower_threshold_limit As LowerLimit', 'sustainabilitymanagement_Sensor_Register.upper_threshold_limit As UpperLimit')
        .orderBy('sustainabilitymanagement_Sensor_Data.timestamp'))
    ]);
    tempWithThresholdValue = {
        Hourly: hourlyData
    }
    return { HourlyTempWithThresholdValue: tempWithThresholdValue }

}
module.exports = { calcHourlyTempWithThresholdValue }
