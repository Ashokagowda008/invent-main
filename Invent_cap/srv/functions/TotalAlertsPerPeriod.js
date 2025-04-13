const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const moment = require('moment');
const _ = require('lodash');
const { filterPeriodWiseData } = require('../formatter/formatter');

async function calcTotalAlertsPerPeriod(req) {

    let [year, plantId, EquipmentTypeid, period, meterId, meterPeriod] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period, req.data.meterId, req.data.meterPeriod];
    let sensortype = "temperature";
    let conditions = [];
    let query = "";
    if (year) {
        conditions.push(`YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) = ${year}`);
    }
    if (period) {
        let monthRange = await filterPeriodWiseData(period);
        conditions.push(`EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) >= ${monthRange.startMonth} AND EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) <=${monthRange.endMonth}`);
    }
    if (meterId) {
        conditions.push(`sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = '${meterId}'`);
    }
    if (plantId) {
        conditions.push(`sustainabilitymanagement_Sensor_Register.plant_id = '${plantId}'`);
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
    let AlertsPerperiod = {};
    let [quarter1, quarter2, quarter3, quarter4] = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
    // let [dailyData, monthlyData, quarterlyData, yearlyData] = await Promise.all([
    let dailyQuery = tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Alerts')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns('DATE(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) As Day', "TO_VARCHAR(DATE(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp), 'DD-Mon') As period", 'COUNT(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) AS totalAlerts')
        .groupBy('DATE(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)')
        .orderBy('DATE(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)'));

    let monthlyQuery = tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Alerts')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns("SUBSTRING(MONTHNAME(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp),0,3) As period", 'MONTH(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) As Month', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) as Year', 'COUNT(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) AS totalAlerts')
        .groupBy('MONTH(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)', 'MONTHNAME(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)')
        .orderBy('MONTH(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)'));
    let quarterlyQuery = tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Alerts')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns(`CASE WHEN QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) LIKE '%Q1%' THEN '${quarter1}' WHEN QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) LIKE '%Q2%' THEN '${quarter2}' WHEN QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) LIKE '%Q3%' THEN '${quarter3}' WHEN QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) LIKE '%Q4%' THEN '${quarter4}' END As period`, 'QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) As Quarter', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) as Year', 'COUNT(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) AS totalAlerts')
        .groupBy('QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)')
        .orderBy('QUARTER(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)'));
    let yearlyQuery = tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Alerts')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns('YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) As period', 'YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) as Year', 'COUNT(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp) AS totalAlerts')
        .groupBy('YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)')
        .orderBy('YEAR(sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp)'))
    let queryArray = [dailyQuery, monthlyQuery, quarterlyQuery, yearlyQuery];
    if (meterPeriod === 'Days') {
        queryArray = [dailyQuery, "", "", ""];
    } else if (meterPeriod === 'Monthly') {
        queryArray = ["", monthlyQuery, "", ""];
    }
    else if (meterPeriod === 'Quarterly') {
        queryArray = ["", "", quarterlyQuery, ""];
    }
    else if (meterPeriod === 'Yearly') {
        queryArray = ["", "", "", yearlyQuery];
    }
    let [dailyData, monthlyData, quarterlyData, yearlyData] = await Promise.all(queryArray);
    let modifiedDailyData = dailyData ? fillMissingDates(dailyData, year) : '';
    let modifiedMonthlyData = monthlyData ? adjustMonthRecords(monthlyData, year) : '';
    if (quarterlyData) {
        let quartersInYear = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
        quartersInYear.forEach((quarter, i) => {
            const quarterYear = `${year}-Q${i + 1}`;
            if (!quarterlyData.find(q => q.Quarter === quarterYear)) {
                quarterlyData.splice(i, 0, { "period": quarter, "Quarter": quarterYear, "Year": year, "totalAlerts": 0 });
            }
        });
    }
    AlertsPerperiod = {
        Days: modifiedDailyData,
        Monthly: modifiedMonthlyData,
        Quarterly: quarterlyData,
        Yearly: yearlyData
    }
    return { TotalAlertsPerperiod: AlertsPerperiod }
}
function generateMonths(year, period) {
    let months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    return months.map((month, index) => ({
        period: month,
        Month: index + 1,
        Year: year,
        totalAlerts: 0
    }));
}
function adjustMonthRecords(records, year, period) {
    // Generate all months
    const allMonths = generateMonths(year, period);

    // Iterate over the records and update the corresponding month in allMonths
    for (const record of records) {
        const index = allMonths.findIndex(month => month.Month == record.Month && month.Year == record.Year);
        if (index !== -1) {
            allMonths[index] = record; // update the record
        }
    }
    return allMonths;
}
const fillMissingDates = (data, year) => {
    let startDate = new Date(year + "-01-01");
    let endDate = new Date(year + "-12-31");

    let dateMap = data.reduce((map, obj) => {
        map[obj.Day] = obj;
        return map;
    }, {});

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        let dStr = d.toISOString().split('T')[0]; // convert date to yyyy-mm-dd format
        if (!dateMap[dStr]) {
            let periodStr = `${dStr.split('-')[2]}-${new Intl.DateTimeFormat('en', { month: 'short' }).format(d)}`
            dateMap[dStr] = {
                "Day": dStr,
                "period": periodStr,
                "totalAlerts": 0
            };
        }
    }

    // Convert the dateMap back into an array
    let result = Object.values(dateMap);

    // Sort the array by date
    result.sort((a, b) => new Date(a.Day) - new Date(b.Day));

    return result;
}

module.exports = { calcTotalAlertsPerPeriod }
