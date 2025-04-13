const cds = require("@sap/cds");
const LOG = cds.log('SusService');
// const express = require('express');
// const puppeteer = require('puppeteer');
// const xlsx = require('xlsx'); // "xlsx": "0.10.0"
const { filterPeriodWiseData, getFirstAndLastDates } = require('./formatter/formatter');
const uploadExcel = require('./functions/uploadExcel');
const totalEnergyUsed = require('./functions/TotalEnergyUsed');
const totalCEValue = require('./functions/TotalCEValue');
const totalRenewablePercEnergy = require('./functions/TotalRenewablePercEnergy');
const _CEValueVsPlant = require('./functions/CEValueVsPlant');
const _ElectricityVsEquipType = require('./functions/ElectricityVsEquipType');
const _CEValueVsMeter = require('./functions/CEValueVsMeter');
const _TotalAlertsPerPeriod = require('./functions/TotalAlertsPerPeriod');
const _getHourlyTempWithThresholdValue = require('./functions/HourlyTempWithThresholdValue');
const _CEValueVsEquipmentType = require('./functions/CEValueVsEquipmentType');
const _CEValueVsFuelType = require('./functions/CEValueVsFuelType');
const _GetEquipDocument = require('./functions/GetEquipDocSet');

module.exports = cds.service.impl(async function (srv) {
   const { Plant_Info_Entity, Equipment_type_Entity, Sensor_Alerts_Entity } = this.entities;

   srv.after('READ', Plant_Info_Entity, async function (data, req) {
      data.forEach((each) => {
         each.posvalue = "" + each.lattitude + ";" + each.longitude + ";0"
      })
      data.unshift({ id: "All", desc: "All" })
   })
   srv.after('READ', Equipment_type_Entity, async function (data, req) {
      data.unshift({ id: "All", desc: "All" })
   })

   srv.on('deleteAll', async (req) => {
      await DELETE.from('SusService.Sensor_Data_Entity');
      await DELETE.from('SusService.Sensor_Alerts_Entity');
   })

   srv.on('uploadExcel', async (req) => {
      try {
         await uploadExcel.uploadSensorData(req);
         return 'Upload completed';
      } catch (e) {
         req.error({ code: "500", message: "Error while upload" });
      }
   })

   srv.on('getTotalEnergyUsed', async (req) => {
      try {
         let finalOutput = await totalEnergyUsed.calcTotalEnergyUsed(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getTotalCEValue', async (req) => {
      try {
         let finalOutput = await totalCEValue.calcTotalCEValue(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }

   })

   srv.on('getTotalRenewablePercEnergy', async (req) => {
      try {
         let finalOutput = await totalRenewablePercEnergy.calcTotalReneweblePercEnergy(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getCEValueVsPlant', async (req) => {
      try {
         let finalOutput = await _CEValueVsPlant.calcCEValueVsPlant(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getElectricityVsEquipType', async (req) => {
      try {
         let finalOutput = await _ElectricityVsEquipType.calcElectricityVsEquipType(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getCEValueVsMeter', async (req) => {
      try {
         let finalOutput = await _CEValueVsMeter.calcCEValueVsMeter(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getCEValueVsEquipmentType', async (req) => {
      try {
         let finalOutput = await _CEValueVsEquipmentType.calcCEValueVsEquipmentType(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getCEValueVsFuelType', async (req) => {
      try {
         let finalOutput = await _CEValueVsFuelType.calcCEValueVsFuelType(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getCEValueVsMeter1', async (req) => {
      try {
         let finalOutput = await _CEValueVsMeter.calcCEValueVsMeter1(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }

   })

   srv.on('getTotalAlertsPerPeriod', async (req) => {
      try {
         let finalOutput = await _TotalAlertsPerPeriod.calcTotalAlertsPerPeriod(req);
         return finalOutput;
      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }

   })
   srv.on('getCalcHourlyTempWithThresholdValue', async (req) => {
      try {
         let finalOutput = await _getHourlyTempWithThresholdValue.calcHourlyTempWithThresholdValue(req);
         return finalOutput;

      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })

   srv.on('getEquipDocSet', async (req) => {
      try {
         let finalOutput = await _GetEquipDocument.getEquipDocument(req);
         return finalOutput;

      } catch (e) {
         req.error({ code: "500", message: "Technical Error." });
      }
   })
  


});
