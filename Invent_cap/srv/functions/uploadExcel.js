const cds = require("@sap/cds");
const LOG = cds.log('SusService');
// const xlsx = require('xlsx'); // "xlsx": "0.10.0"
const tx = cds.transaction()
const { dbDateFormatter, dbSensorDataStructue } = require('../formatter/formatter');
async function uploadSensorData(req) {
   let base64Data = req.data.ExcelFile;
   let fileType = req.data.fileType;
   if (base64Data && fileType) {
      var JsonValue = [];
      if (fileType.toUpperCase() === 'CSV') {
         JsonValue = await csvToJson(base64Data);
         if (JsonValue.length > 0) {
            await upsertRecords(JsonValue);
         } else {
            return 'No Records Inserted';
         }
      }
      else {
         LOG.info('Invalid file type')
         return 'Invalid file type';
      }
      // else if (fileType.toUpperCase() === 'XLSX' || fileType.toUpperCase() === 'XLS') {
      //    JsonValue = await excelToJson(base64Data);
      //    await upsertRecords(JsonValue);
      // } 


   }
}
async function csvToJson(base64Data) {
   const csvData = Buffer.from(base64Data, 'base64')
   const utfData = csvData.toString('utf-8');
   let splitingPoint = utfData.includes('\n') && utfData.split('\n').length > 0 ? '\n' : '\r';
   let noOfColssplitted = utfData.split(splitingPoint)[0]
   let noOfCols = noOfColssplitted.includes(';') ? noOfColssplitted.split(";").length : noOfColssplitted.split(",").length;
   let arrCSV = utfData.match(/[\w . \- \@ \/: ]+(?=,?)/g);
   let hdrRow = arrCSV.splice(0, noOfCols);
   let jsonArray = [];
   while (arrCSV.length > 0) {
      var obj = {};
      // extract remaining rows one by one
      let row = arrCSV.splice(0, noOfCols)
      for (var i = 0; i < row.length; i++) {
         obj[hdrRow[i]] = row[i].trim()
      }
      // push row to an array
      jsonArray.push(obj)
   }
   return jsonArray;
}

async function excelToJson(base64Data) {
   let a = Buffer.from(base64Data, 'base64').toString('binary');
   const abc = atob(base64Data);
   const workbook = xlsx.read(abc, { type: 'binary' });
   const sheetNameList = workbook.SheetNames;
   let jsonArray = [];
   sheetNameList.forEach(function (sheetName) {
      jsonArray = xlsx.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
   });
   //   fs.writeFileSync('output.bin', a ,'binary')
   console.log(jsonArray.length)
   return jsonArray;
   // const jsonArray = xlsx.utils.sheet_to_row_object_array(workbook.Sheets[sheetNameList[0]]);
}

async function upsertRecords(newRecords) {
   const plantmaintsrv = await cds.connect.to("plantmaintorderdest");
   let upsertAllRecords = [];
   let alertTable = [];
   let prevRecord = "";
   let nextRecord = "";
   let additionalValues = [];
   let thresholdLimit = 0;
   let upperThresholdLimit = 0;
   let lowerThresholdLimit = 0;
   let sensorId = "";
   //Looping for SD and SA reords
   for (let i = 0; i < newRecords.length; i++) {
      newRecords[i] = Object.keys(newRecords[i]).reduce((acc, key) => {
         acc[key.toUpperCase()] = newRecords[i][key];
         return acc;
      }, {});
      if (!sensorId) {
         sensorId = newRecords[0]["SENSORID"];
         // 'sustainabilitymanagement_Sensor_Register.threshold_limit',
         additionalValues = await tx.run(SELECT
            .from('sustainabilitymanagement_Sensor_Register')
            .join('sustainabilitymanagement_Plant_Info').on('sustainabilitymanagement_Sensor_Register.plant_id = sustainabilitymanagement_Plant_Info.id')
            .where(`sustainabilitymanagement_Sensor_Register.id = '${sensorId}'`)
            .columns('sustainabilitymanagement_Sensor_Register.id As SID', 'sustainabilitymanagement_Sensor_Register.type_id As SensorType', 'sustainabilitymanagement_Sensor_Register.equipment_no', 'sustainabilitymanagement_Plant_Info.id As plant_id', 'sustainabilitymanagement_Plant_Info.desc', 'sustainabilitymanagement_Sensor_Register.lower_threshold_limit','sustainabilitymanagement_Sensor_Register.threshold_limit', 'sustainabilitymanagement_Sensor_Register.upper_threshold_limit', 'sustainabilitymanagement_Sensor_Register.lower_threshold_isactive', 'sustainabilitymanagement_Sensor_Register.upper_threshold_isactive'))
         //Query to get the additional property value for sensor alerts table
         thresholdLimit = additionalValues[0].threshold_limit || 0 
         upperThresholdLimit = (additionalValues && additionalValues[0].upper_threshold_isactive) ? additionalValues[0].upper_threshold_limit : 0;
         lowerThresholdLimit = (additionalValues && additionalValues[0].lower_threshold_isactive) ? additionalValues[0].lower_threshold_limit : 0;
      }
      if (newRecords[i].TIMESTAMP) {
         //Data Table
         let dateInNewRecord = newRecords[i].TIMESTAMP;

         //This code only for Temperature
         if (additionalValues.length > 0 && additionalValues[0].SensorType === 'temperature') {
            let formattedDateInNewRecord = dbDateFormatter(dateInNewRecord, 0);
            newRecords[i].TIMESTAMP = formattedDateInNewRecord;
            newRecords[i].hourlydeff = 0;
            let dbStructueRecord = dbSensorDataStructue(newRecords[i]);
            upsertAllRecords.push(dbStructueRecord);
            //Alerts Table for Temperature
            if ((parseFloat(upperThresholdLimit) != 0) && ((parseFloat(newRecords[i].READING) >= parseFloat(upperThresholdLimit)))) {
               let alertDataStructure = {
                  timestamp_timestamp: dbStructueRecord.timestamp,
                  timestamp_sensor_id: dbStructueRecord.sensor_id,
                  plant_desc: additionalValues[0].desc,
                  threshold_limit: additionalValues[0].threshold_limit,
                  triggered_value: parseFloat(dbStructueRecord.reading),
                  alert_status_code: "1",
                  equipment_no: additionalValues[0].equipment_no,
                  plant_id: additionalValues[0].plant_id,
                  hourlydeff: dbStructueRecord.hourlydeff,
                  lower_threshold_limit: additionalValues[0].lower_threshold_limit,
                  upper_threshold_limit: additionalValues[0].upper_threshold_limit,
               }
               alertTable.push(alertDataStructure);


            }
         } else if (additionalValues.length > 0 && additionalValues[0].SensorType === 'electricity') {
            //This code only for Electricity
            if (i == 0) {
               // Checking  previous record to check hourly defference  for the first record
               let prevTimestamp = dbDateFormatter(dateInNewRecord, -1);
               prevRecord = await SELECT.one.from('SusService.Sensor_Data_Entity').where({ 'timestamp': prevTimestamp, 'sensor_id': newRecords[i].SENSORID });
               prevRecord = prevRecord ? prevRecord : { reading: newRecords[i].READING };
               newRecords[i].hourlydeff = prevRecord ? Number((parseFloat(newRecords[i].READING) - parseFloat(prevRecord.reading)).toFixed(2)) : 0;

            } else {
               newRecords[i].hourlydeff = Number((parseFloat(newRecords[i].READING) - parseFloat(newRecords[i - 1].READING)).toFixed(2));
            }
            // this function should return the date in 'mm/dd/yyyy hh:mm' format
            let formattedDateInNewRecord = dbDateFormatter(dateInNewRecord, 0);
            newRecords[i].TIMESTAMP = formattedDateInNewRecord;
            let dbStructueRecord = dbSensorDataStructue(newRecords[i]);

            upsertAllRecords.push(dbStructueRecord);

            if (newRecords.length - 1 === i) {

               // Checking  Next record to check hourly defference  for the Next record after inserting all
               let nextTimestamp = dbDateFormatter(dateInNewRecord, 1);
               nextRecord = await SELECT.one.from('SusService.Sensor_Data_Entity').where({ 'timestamp': nextTimestamp, 'sensor_id': newRecords[i].sensor_id })
               if (nextRecord) {
                  nextRecord.hourlydeff = Number((parseFloat(nextRecord.reading) - parseFloat(newRecords[i].READING)).toFixed(2))
                  upsertAllRecords.push(nextRecord)
               }
            }
            //Alerts Table

            if ((dbStructueRecord.hourlydeff != 0) && (parseFloat(upperThresholdLimit) != 0) && (dbStructueRecord.hourlydeff >= parseFloat(upperThresholdLimit))) {
               let alertDataStructure = {
                  timestamp_timestamp: dbStructueRecord.timestamp,
                  timestamp_sensor_id: dbStructueRecord.sensor_id,
                  plant_desc: additionalValues[0].desc,
                  threshold_limit: additionalValues[0].threshold_limit,
                  triggered_value: parseFloat(dbStructueRecord.reading),
                  equipment_no: additionalValues[0].equipment_no,
                  alert_status_code: "1",
                  plant_id: additionalValues[0].plant_id,
                  hourlydeff: dbStructueRecord.hourlydeff,
                  lower_threshold_limit: additionalValues[0].lower_threshold_limit,
                  upper_threshold_limit: additionalValues[0].upper_threshold_limit,
               }
               alertTable.push(alertDataStructure);
            }
         }
      }

   }
   if (upsertAllRecords.length > 0)
      await UPSERT.into('SusService.Sensor_Data_Entity').entries(upsertAllRecords);
   if (alertTable.length > 0) {
      let newMatchingRecords = [];
      let newNonMatchingRecords = [];
      let regObj = await tx.run(SELECT.one.from('sustainabilitymanagement_Sensor_Register')
         .where(`sustainabilitymanagement_Sensor_Register.id='${alertTable[0].timestamp_sensor_id}'`)
         .columns('sustainabilitymanagement_Sensor_Register.equipment_no As EquipmentNo', 'sustainabilitymanagement_Sensor_Register.plant_id As PlantId', 'sustainabilitymanagement_Sensor_Register.create_maintainance_order As maintainOrder'));
      if (regObj.maintainOrder) {
         const aData = JSON.stringify({
            "Equipment": regObj.EquipmentNo,
            "Plant": regObj.PlantId,
            "Orderdesc": "Water Pump cooling issue"
         });
         let aExistingAlerts = await tx.run(SELECT.from('sustainabilitymanagement_Sensor_Alerts')
            .where(`sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id = '${alertTable[0].timestamp_sensor_id}'  AND sustainabilitymanagement_Sensor_Alerts.order_no IS NOT NULL`)
            .columns('sustainabilitymanagement_Sensor_Alerts.timestamp_sensor_id', 'sustainabilitymanagement_Sensor_Alerts.timestamp_timestamp', 'sustainabilitymanagement_Sensor_Alerts.order_no'));
         if (aExistingAlerts.length > 0) {

            alertTable.forEach(async function (alertItem) {
               let RecordFound = false;
               aExistingAlerts.forEach(async function (eAlertItem) {
                  let alertDateTime = new Date(alertItem.timestamp_timestamp).toISOString();
                  let eAlertItemDateTime = new Date(eAlertItem.timestamp_timestamp).toISOString();
                  if (alertItem.timestamp_sensor_id == eAlertItem.timestamp_sensor_id && alertDateTime == eAlertItemDateTime) {
                     RecordFound = true;
                     alertItem.order_no = eAlertItem.order_no;
                     newMatchingRecords.push(alertItem);
                  }
               })
               if (!RecordFound) {
                  newNonMatchingRecords.push(alertItem);
               }
            })
            if (newNonMatchingRecords.length > 0) {
               let newRecords = await sendPostRequest(newNonMatchingRecords, aData);
               await UPSERT.into('SusService.Sensor_Alerts_Entity').entries(newRecords);
            }
            if (newMatchingRecords.length > 0) {
               let { closedRecords, openRecords } = await sendGetRequest(newMatchingRecords);
               if (closedRecords.length > 0) {
                  let newClosedRecords = await sendPostRequest(closedRecords, aData);
                  await UPSERT.into('SusService.Sensor_Alerts_Entity').entries(newClosedRecords);
               } else if (openRecords.length > 0) {
                  await UPSERT.into('SusService.Sensor_Alerts_Entity').entries(openRecords);
               }
            }
         } else {
            let alertsRecord = await sendPostRequest(alertTable, aData);
            await UPSERT.into('SusService.Sensor_Alerts_Entity').entries(alertsRecord);
         }
      } else {
         await UPSERT.into('SusService.Sensor_Alerts_Entity').entries(alertTable);
      }
   }
}


async function sendGetRequest(records) {
   let closedRecords = [];
   let openRecords = [];
   const plantmaintsrv = await cds.connect.to("plantmaintorderdest");
   // let promise = await plantmaintsrv.send('POST', "/MaintenanceOrderSet", aData, { "Content-Type": "application/Json", "Accept": "application/Json" })
   var that = this;
   // @ts-ignore
   const success = res => res.ok ? res.json() : Promise.resolve({});
   let requests = records.map(async record => {
      // @ts-ignore
      const promise = await plantmaintsrv.send('GET', "/MaintenanceOrderSet(Orderno='" + record.order_no + "')");
      return promise;
   });
   // @ts-ignore
   const results = await Promise.all(requests);
   results.forEach(function (orderData, idx) {
      records.forEach(async function (record, idx) {
         if (record.order_no == orderData.Orderno && orderData.Status === 'CLSD') {
            closedRecords.push(record);
         } else if (record.order_no == orderData.Orderno) {
            record.notification_no = orderData.Notifno;
            openRecords.push(record);
         }

      });
   });
   return { closedRecords, openRecords };
}

async function sendPostRequest(records, aData) {
   const plantmaintsrv = await cds.connect.to("plantmaintorderdest");
   // let promise = await plantmaintsrv.send('POST', "/MaintenanceOrderSet", aData, { "Content-Type": "application/Json", "Accept": "application/Json" })
   var that = this;
   // @ts-ignore
   const success = res => res.ok ? res.json() : Promise.resolve({});
   let requests = records.map(async record => {
      // @ts-ignore
      const promise = await plantmaintsrv.send('POST', "/MaintenanceOrderSet", aData, { "Content-Type": "application/Json", "Accept": "application/Json" })
      return promise;
   });
   // @ts-ignore
   const results = await Promise.all(requests);
   results.forEach(function (orderData, idx) {
      records[idx].order_no = orderData.Orderno;
      records[idx].notification_no = orderData.Notifno;
   });
   return records;

}
module.exports = { uploadSensorData }