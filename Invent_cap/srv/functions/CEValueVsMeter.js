const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const { filterPeriodWiseData, filterMonthName } = require('../formatter/formatter');

//With Global filters and Local filters 
async function calcCEValueVsMeter1(req) {

   let [year, plantId, EquipmentTypeid, period, filterDate, meterId, meterPeriod] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period, req.data.filterDate, req.data.meterId, req.data.meterPeriod]
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
   if (filterDate) {
      let [yearfilter, monthfilter, dayfilter] = [new Date(filterDate).getUTCFullYear(), new Date(filterDate).getUTCMonth() + 1, new Date(filterDate).getUTCDate()];
      conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${yearfilter}
         AND MONTH(sustainabilitymanagement_Sensor_Data.timestamp) = ${monthfilter}
         AND DAY(sustainabilitymanagement_Sensor_Data.timestamp) = ${dayfilter}`)
   }

   if (meterId) {
      conditions.push(`sustainabilitymanagement_Sensor_Data.sensor_id = '${meterId}'`);
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
   let uniqueMeter = [];
   if (meterId) {
      uniqueMeter.push({ meterId: meterId });
   } else {
      uniqueMeter = await tx.run(SELECT.distinct
         .from('sustainabilitymanagement_Sensor_Data').columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId'));
   }
   let sensorResults = {};
   let [quarter1, quarter2, quarter3, quarter4] = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
   let thresholdLimit = 0;
   let hourlyQuery = tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
      .columns('sustainabilitymanagement_Sensor_Data.sensor_id As sensorid', 'sustainabilitymanagement_Sensor_Data.timestamp As period', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS hourlyDiffReadingCeValue', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff) AS DECIMAL(10,2)), 2) AS hourlyDiffReading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.reading) AS DECIMAL(10,2)), 2) AS reading', `'${thresholdLimit}' AS threshold_limit`)
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'sustainabilitymanagement_Sensor_Data.timestamp', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)', 'sustainabilitymanagement_Sensor_Register.threshold_limit')
      .orderBy('sustainabilitymanagement_Sensor_Data.timestamp', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'));

   let dailyQuery = tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
      .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', "TO_VARCHAR(DATE(sustainabilitymanagement_Sensor_Data.timestamp), 'DD-Mon') As period", 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'DATE(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
      .orderBy('DATE(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))

   let monthlyQuery = tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
      .columns(
         'sustainabilitymanagement_Sensor_Data.sensor_id As meterId', "SUBSTRING(MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp),0,3) As period", 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp) As Months', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp)', 'MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
      .orderBy('MONTH(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))

   let quarterlyQuery = tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
      .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', `CASE WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q1%' THEN '${quarter1}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q2%' THEN '${quarter2}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q3%' THEN '${quarter3}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q4%' THEN '${quarter4}' END As period`, 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) As Quarters', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
      .orderBy('QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))

   let yearlyQuery = tx.run(SELECT
      .from('sustainabilitymanagement_Sensor_Data')
      .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
      .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
      .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
      .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) As period', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
      .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
      .orderBy('YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))

   let queryArray = [hourlyQuery, dailyQuery, monthlyQuery, quarterlyQuery, yearlyQuery];
   if (meterPeriod === 'Daily') {
      queryArray = ["", dailyQuery, "", "", ""];
   } else if (meterPeriod === 'Monthly') {
      queryArray = ["", "", monthlyQuery, "", ""];
   }
   else if (meterPeriod === 'Hourly') {
      queryArray = [hourlyQuery, "", "", "", ""];
   }
   else if (meterPeriod === 'Quarterly') {
      queryArray = ["", "", "", quarterlyQuery, ""];
   }
   else if (meterPeriod === 'Yearly') {
      queryArray = ["", "", "", "", yearlyQuery];

   }
   for (const sensorIdRecord of uniqueMeter) {
      const meterId = sensorIdRecord.meterId;
      let additionalValues = await tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Register')
         .join('sustainabilitymanagement_Plant_Info').on('sustainabilitymanagement_Sensor_Register.plant_id = sustainabilitymanagement_Plant_Info.id')
         .where(`sustainabilitymanagement_Sensor_Register.id = '${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Register.id As SID', 'sustainabilitymanagement_Plant_Info.id As plant_id', 'sustainabilitymanagement_Plant_Info.desc', 'sustainabilitymanagement_Sensor_Register.threshold_limit', 'sustainabilitymanagement_Sensor_Register.lower_threshold_limit', 'sustainabilitymanagement_Sensor_Register.upper_threshold_limit', 'sustainabilitymanagement_Sensor_Register.lower_threshold_isactive', 'sustainabilitymanagement_Sensor_Register.upper_threshold_isactive'))
      thresholdLimit = additionalValues && additionalValues[0].lower_threshold_isactive ? (additionalValues[0].lower_threshold_limit || 0) : additionalValues && additionalValues[0].upper_threshold_isactive ? (additionalValues[0].upper_threshold_limit || 0) : (additionalValues[0].threshold_limit || 0);

      let [hourlyData, dailyData, monthlyData, quarterlyData, yearlyData] = await Promise.all(queryArray);

      if (meterPeriod === 'Daily') {
         sensorResults[meterId] = { Days: dailyData }
      } else if (meterPeriod === 'Monthly') {
         sensorResults[meterId] = { Monthly: monthlyData }
      }
      else if (meterPeriod === 'Hourly') {
         sensorResults[meterId] = { Hourly: hourlyData }
      }
      else if (meterPeriod === 'Quarterly') {
         sensorResults[meterId] = { Quarterly: quarterlyData }
      }
      else if (meterPeriod === 'Yearly') {
         sensorResults[meterId] = { Yearly: yearlyData }
      } else {
         sensorResults[meterId] = {
            Hourly: hourlyData,
            Days: dailyData,
            Monthly: monthlyData,
            Quarterly: quarterlyData,
            Yearly: yearlyData
         }
      }

   }



   return { CEValueVsMeter: sensorResults }
}

//With Global filters only
async function calcCEValueVsMeter(req) {
   // let [year, plantId, EquipmentTypeid, period, filterDate] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period, req.data.filterDate]
   let [year, plantId, EquipmentTypeid, period, filterDate] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period, req.data.filterDate]
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
   if (filterDate) {
      let [yearfilter, monthfilter, dayfilter] = [new Date(filterDate).getUTCFullYear(), new Date(filterDate).getUTCMonth() + 1, new Date(filterDate).getUTCDate()];
      conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${yearfilter}
         AND MONTH(sustainabilitymanagement_Sensor_Data.timestamp) = ${monthfilter}
         AND DAY(sustainabilitymanagement_Sensor_Data.timestamp) = ${dayfilter}`)
   }

   // if (meterId) {
   //    conditions.push(`sustainabilitymanagement_Sensor_Data.sensor_id = '${meterId}'`);
   // }
   // if (meterPeriod) {
   //    conditions.push(`sustainabilitymanagement_Sensor_Data.sensor_id = '${meterPeriod}'`);
   // }
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
   // let uniqueMeter = [];
   // if (meterId) {
   //    uniqueMeter.push({ meterId: meterId });
   // } else {
   let uniqueMeter = await tx.run(SELECT.distinct
      .from('sustainabilitymanagement_Sensor_Data').columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId'));
   // }
   let sensorResults = {};
   let [quarter1, quarter2, quarter3, quarter4] = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
   for (const sensorIdRecord of uniqueMeter) {
      const meterId = sensorIdRecord.meterId;
      let additionalValues = await tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Register')
         .join('sustainabilitymanagement_Plant_Info').on('sustainabilitymanagement_Sensor_Register.plant_id = sustainabilitymanagement_Plant_Info.id')
         .where(`sustainabilitymanagement_Sensor_Register.id = '${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Register.id As SID', 'sustainabilitymanagement_Plant_Info.id As plant_id', 'sustainabilitymanagement_Plant_Info.desc', 'sustainabilitymanagement_Sensor_Register.threshold_limit', 'sustainabilitymanagement_Sensor_Register.lower_threshold_limit', 'sustainabilitymanagement_Sensor_Register.upper_threshold_limit', 'sustainabilitymanagement_Sensor_Register.lower_threshold_isactive', 'sustainabilitymanagement_Sensor_Register.upper_threshold_isactive'))
      let thresholdLimit = additionalValues && additionalValues[0].lower_threshold_isactive ? (additionalValues[0].lower_threshold_limit || 0) : additionalValues && additionalValues[0].upper_threshold_isactive ? (additionalValues[0].upper_threshold_limit || 0) : (additionalValues[0].threshold_limit || 0);

      let [hourlyData, dailyData, monthlyData, quarterlyData, yearlyData] = await Promise.all([tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Data')
         .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
         .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
         .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Data.sensor_id As sensorid', 'sustainabilitymanagement_Sensor_Data.timestamp As period', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS hourlyDiffReadingCeValue', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff) AS DECIMAL(10,2)), 2) AS hourlyDiffReading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.reading) AS DECIMAL(10,2)), 2) AS reading', `'${thresholdLimit}' AS threshold_limit`)
         .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'sustainabilitymanagement_Sensor_Data.timestamp', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)', 'sustainabilitymanagement_Sensor_Register.threshold_limit')
         .orderBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'sustainabilitymanagement_Sensor_Data.timestamp', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
      tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Data')
         .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
         .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
         .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', 'DATE(sustainabilitymanagement_Sensor_Data.timestamp) As period', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
         .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'DATE(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
         .orderBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'DATE(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
      tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Data')
         .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
         .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
         .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
         .columns(
            'sustainabilitymanagement_Sensor_Data.sensor_id As meterId', 'MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp) As period', 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp) As Months', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
         .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp)', 'MONTHNAME(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
         .orderBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'MONTH(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
      tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Data')
         .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
         .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
         .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', `CASE WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q1%' THEN '${quarter1}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q2%' THEN '${quarter2}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q3%' THEN '${quarter3}' WHEN QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) LIKE '%Q4%' THEN '${quarter4}' END As period`, 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp) As Quarters', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
         .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
         .orderBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'QUARTER(sustainabilitymanagement_Sensor_Data.timestamp)', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')),
      tx.run(SELECT
         .from('sustainabilitymanagement_Sensor_Data')
         .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
         .join('sustainabilitymanagement_Fuel_Category').on('sustainabilitymanagement_Sensor_Register.fuel_type = sustainabilitymanagement_Fuel_Category.type')
         .where(query + ` And sustainabilitymanagement_Sensor_Data.sensor_id='${meterId}'`)
         .columns('sustainabilitymanagement_Sensor_Data.sensor_id As meterId', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) As period', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp) as Year', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value)/1000 AS DECIMAL(10,2)), 2) AS reading', 'ROUND(CAST(SUM(sustainabilitymanagement_Sensor_Data.hourlydeff * sustainabilitymanagement_Fuel_Category.carbon_emission_value) AS DECIMAL(10,2)), 2) AS TotalCeValueinGrams')
         .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)')
         .orderBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'YEAR(sustainabilitymanagement_Sensor_Data.timestamp)'))
      ])
      if (hourlyData.length > 0) {
         sensorResults[meterId] = {
            Hourly: hourlyData,
            Days: dailyData,
            Monthly: monthlyData,
            Quarterly: quarterlyData,
            Yearly: yearlyData
         }
      }

   }



   return { CEValueVsMeter: sensorResults }
}

module.exports = { calcCEValueVsMeter1, calcCEValueVsMeter }