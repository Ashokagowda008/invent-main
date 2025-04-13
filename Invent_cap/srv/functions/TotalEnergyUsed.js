const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const LOG = cds.log('SusService');
const { filterPeriodWiseData, filterMonthName } = require('../formatter/formatter');
async function calcTotalEnergyUsed(req) {
   let [year, plantId, EquipmentTypeid, period] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period]
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
   const result = await tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data').alias('SD')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .where(query)
      .columns('SUM(sustainabilitymanagement_Sensor_Data.hourlydeff) AS TotalEnergyUsed'))
   let [finalOutput, TotalEnergyUsed] = [{}, result[0].TotalEnergyUsed ? result[0].TotalEnergyUsed : 0]
   finalOutput.TotalEnergyUsed = {
      Year: year,
      TotalEnergyUsed: parseFloat(TotalEnergyUsed) > 1000 ? (parseFloat(TotalEnergyUsed)/1000).toFixed(2) : parseFloat(TotalEnergyUsed).toFixed(2),
      unit: parseFloat(TotalEnergyUsed) > 1000 ? "MW" : "kWh"
   }
   return finalOutput;
}

module.exports = {calcTotalEnergyUsed}