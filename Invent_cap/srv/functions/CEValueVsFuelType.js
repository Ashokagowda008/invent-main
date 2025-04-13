const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const { filterPeriodWiseData} = require('../formatter/formatter');

async function calcCEValueVsFuelType(req) {
    let [year, plantId, EquipmentTypeid, period] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period];
    let sensortype = "electricity"
    let conditions = [`sustainabilitymanagement_Sensor_Data.hourlydeff IS NOT NULL`];
    let query = "";
    if (year) {
        conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${year}`);
    }
    if (period) {
        let monthRange = await filterPeriodWiseData(period);
        conditions.push(`EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Data.timestamp) >= ${monthRange.startMonth} AND EXTRACT(MONTH FROM sustainabilitymanagement_Sensor_Data.timestamp) <=${monthRange.endMonth}`);
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
    let fuelResults = {};
    let [quarter1, quarter2, quarter3, quarter4] = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
    let uniqueFuelTypes = await tx.run(SELECT.distinct
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .columns('sustainabilitymanagement_Sensor_Register.fuel_type As fuelType'));
    
        let [dailyData, monthlyData, quarterlyData, yearlyData] = await Promise.all([tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns('DATE(sustainabilitymanagement_Sensor_Data.timestamp) As Day',"TO_VARCHAR(DATE(sustainabilitymanagement_Sensor_Data.timestamp), 'DD-Mon') As period", 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS totalreading', ...uniqueFuelTypes.map(fuelType => `ROUND(CAST(SUM(CASE WHEN sustainabilitymanagement_Sensor_Register.fuel_type = '${fuelType.fuelType}' THEN sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value ELSE 0 END)/1000 AS DECIMAL(10,2)), 2) As ${fuelType.fuelType}_readings`))
        .groupBy('DATE(sustainabilitymanagement_Sensor_Data.timestamp)')
        .orderBy('DATE(sustainabilitymanagement_Sensor_Data.timestamp)')
        ),
       
    tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns("SUBSTRING(MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp),0,3) As period", 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp) As Month', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS totalreading', ...uniqueFuelTypes.map(fuelType => `ROUND(CAST(SUM(CASE WHEN sustainabilitymanagement_Sensor_Register.fuel_type = '${fuelType.fuelType}' THEN sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value ELSE 0 END)/1000 AS DECIMAL(10,2)), 2) As ${fuelType.fuelType}_readings`))
        .groupBy('MONTH(sustainabilitymanagement_Sensor_Data.timestamp)', 'MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
        .orderBy('MONTH(sustainabilitymanagement_Sensor_Data.timestamp)','YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
    tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns( `CASE WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q1%' THEN '${quarter1}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q2%' THEN '${quarter2}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q3%' THEN '${quarter3}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q4%' THEN '${quarter4}' END As period`, 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) As Quarter', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS totalreading', ...uniqueFuelTypes.map(fuelType => `ROUND(CAST(SUM(CASE WHEN sustainabilitymanagement_Sensor_Register.fuel_type = '${fuelType.fuelType}' THEN sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value ELSE 0 END)/1000 AS DECIMAL(10,2)), 2) As ${fuelType.fuelType}_readings`))
        .groupBy('QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
        .orderBy('QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
    tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
        .where(query)
        .columns('YEAR(sustainabilitymanagement_Sensor_Data.timestamp) As period', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS totalreading', ...uniqueFuelTypes.map(fuelType => `ROUND(CAST(SUM(CASE WHEN sustainabilitymanagement_Sensor_Register.fuel_type = '${fuelType.fuelType}' THEN sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value ELSE 0 END)/1000 AS DECIMAL(10,2)), 2) As ${fuelType.fuelType}_readings`))
        .groupBy('YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
        .orderBy('YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))
       
    ]);
    fuelResults = {
        Days: dailyData,
        Monthly: monthlyData,
        Quarterly: quarterlyData,
        Yearly: yearlyData
     }
     return { CEValueVsFuelType: fuelResults }

}
module.exports = {calcCEValueVsFuelType}