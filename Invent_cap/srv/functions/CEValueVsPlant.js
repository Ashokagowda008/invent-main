const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const LOG = cds.log('SusService');
const { filterPeriodWiseData, filterMonthName } = require('../formatter/formatter');
async function calcCEValueVsPlant(req) {
   let [year, EquipmentTypeid, period] = [req.data.year, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period]
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
   const plantVsCeData = await tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Plant_Info').on('sustainabilitymanagement_Sensor_Register.plant_id = sustainabilitymanagement_Plant_Info.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query)
      .columns('sustainabilitymanagement_Sensor_Data.sensor_id As SensorId', 'sustainabilitymanagement_Plant_Info.id As PlantId', 'sustainabilitymanagement_Plant_Info.desc AS PlantName', 'SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS TotalCeValue', 'SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS TotalCeValueinGrams', 'SUM(sustainabilitymanagement_Sensor_Data.hourlydeff) AS TotalEnergyUsed')
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'sustainabilitymanagement_Plant_Info.id', 'sustainabilitymanagement_Plant_Info.desc'))
   let finalOutput = {};
   const finalResult = plantVsCeData.reduce((acc, record) => {
      const { PlantId, TotalCeValue, TotalCeValueinGrams } = record;
      record.Year = year;
      record.TotalCeValue = Number(parseFloat(TotalCeValue).toFixed(2));
      record.TotalCeValueinGrams = Number(parseFloat(TotalCeValueinGrams).toFixed(2));
      if (acc[PlantId]) {
         acc[PlantId].TotalCeValue = (+acc[PlantId].TotalCeValue + +TotalCeValue).toFixed(2);
         acc[PlantId].TotalCeValueinGrams = (+acc[PlantId].TotalCeValueinGrams + +TotalCeValueinGrams).toFixed(2);
      } else {
         acc[PlantId] = { ...record };
      }
      return acc;
   }, {});

   finalOutput.CEValueVsPlant = Object.values(finalResult);

   return finalOutput;
}

module.exports = { calcCEValueVsPlant }