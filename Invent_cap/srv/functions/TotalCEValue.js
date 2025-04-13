const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const LOG = cds.log('SusService');
const { filterPeriodWiseData, filterMonthName } = require('../formatter/formatter');
async function calcTotalCEValue(req) {
   let [year, plantId, EquipmentTypeid, period] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period]
   let sensortype = "electricity"
   let presentYearData = await getTotalCEValueWithDeff(year, plantId, EquipmentTypeid, period, sensortype); 
   let prevYearData = await getTotalCEValueWithDeff(parseFloat(year)-1, plantId, EquipmentTypeid, period, sensortype); 
   let [finalOutput, TotalCeValue, TotalMeterCeValue, prevTotalMeterCeValue] = [{}, presentYearData[0].TotalCeValue ? presentYearData[0].TotalCeValue : 0, presentYearData[0].TotalCeValuePerc ? presentYearData[0].TotalCeValuePerc : 0, ((prevYearData.length > 0 && prevYearData[0].TotalCeValuePerc) ? prevYearData[0].TotalCeValuePerc : 0)]
   TotalMeterCeValue = parseFloat(TotalMeterCeValue) > 1000 ? (parseFloat(TotalMeterCeValue)/1000).toFixed(2) : parseFloat(TotalMeterCeValue).toFixed(2);
   prevTotalMeterCeValue = parseFloat(prevTotalMeterCeValue) > 1000 ? (parseFloat(prevTotalMeterCeValue)/1000).toFixed(2) : parseFloat(prevTotalMeterCeValue).toFixed(2);
   let deffFromPrevYearValue = parseFloat(prevTotalMeterCeValue) === 0 ? 0 : (parseFloat(TotalMeterCeValue) - (prevTotalMeterCeValue ? parseFloat(prevTotalMeterCeValue) : 0))
   let  DeffFromPrevValue = parseFloat(TotalMeterCeValue) > 1000 ? (parseFloat(deffFromPrevYearValue)/1000).toFixed(2) : parseFloat(deffFromPrevYearValue).toFixed(2);
   let DeffFromPrevValuePerc = isNaN((DeffFromPrevValue/prevTotalMeterCeValue)) ? 0 : (DeffFromPrevValue/prevTotalMeterCeValue) * 100
   finalOutput.TotalCEValue = {
      Year: year,
      TotalCeValueinGrams: parseFloat(TotalCeValue).toFixed(2),
      DeffFromPrevValuePerc: parseFloat(DeffFromPrevValuePerc).toFixed(2),
      TotalPYCeValue: prevTotalMeterCeValue,
      DiffStatus: parseFloat(DeffFromPrevValue) <= 0 ? "Positive" : "Negative",
      TotalCeValue: TotalMeterCeValue,
      unit: parseFloat(TotalMeterCeValue) > 1000 ? "ton" : "kg"
    }
   return finalOutput;
}
async function getTotalCEValueWithDeff(year, plantId, EquipmentTypeid, period, sensortype){
   let conditions = [`sustainabilitymanagement_Sensor_Data.hourlydeff IS NOT NULL`];
   let query = "";
   if (year) {
      conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${year}`);
      // conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${parseFloat(year)-1}`);
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
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Plant_Info').on('sustainabilitymanagement_Sensor_Register.plant_id = sustainabilitymanagement_Plant_Info.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query)
      .columns('SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS TotalCeValuePerc', 'SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS TotalCeValue'))
     return result;
   }

module.exports = { calcTotalCEValue }