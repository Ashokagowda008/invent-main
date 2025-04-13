const cds = require("@sap/cds");
const SELECT = cds.ql.SELECT;
const LOG = cds.log('SusService');
const { filterPeriodWiseData } = require('../formatter/formatter');
async function calcElectricityVsEquipType(req) {
    let [year, plantId, EquipmentTypeid, period] = [req.data.year, req.data.plantid === "All" ? "" : req.data.plantid, req.data.EquipmentTypeid === "All" ? "" : req.data.EquipmentTypeid, req.data.period === "All" ? "" : req.data.period]
    let sensortype = "electricity"
    let conditions = [`sustainabilitymanagement_Sensor_Data.hourlydeff IS NOT NULL`];
    let query = "";
    if (year) {
        conditions.push(`YEAR(sustainabilitymanagement_Sensor_Data.timestamp) = ${year}`);
    }
    if (plantId) {
        conditions.push(`sustainabilitymanagement_Sensor_Register.plant_id = '${plantId}'`);
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
    const EquipTypeVsElecData = await tx.run(SELECT
        .from('sustainabilitymanagement_Sensor_Data')
        .join('sustainabilitymanagement_Sensor_Register').on('sustainabilitymanagement_Sensor_Data.sensor_id = sustainabilitymanagement_Sensor_Register.id')
        .join('sustainabilitymanagement_equipment_type').on('sustainabilitymanagement_equipment_type.id = sustainabilitymanagement_Sensor_Register.equipment_type_id')
        .where(query)
        .columns('sustainabilitymanagement_Sensor_Data.sensor_id As SensorId', 'sustainabilitymanagement_equipment_type.desc As Equipmenttype', 'SUM(sustainabilitymanagement_Sensor_Data.hourlydeff) AS TotalEnergyUsed')
        .groupBy('sustainabilitymanagement_Sensor_Data.sensor_id', 'sustainabilitymanagement_equipment_type.desc'))

    let finalOutput = {};

    const result = EquipTypeVsElecData.reduce((acc, record) => {
        const { Equipmenttype, TotalEnergyUsed } = record;
        record.Unit = "KWh";
        record.Year = year;
        record.TotalEnergyUsed = Number(parseFloat(TotalEnergyUsed).toFixed(2));
        if (acc[Equipmenttype]) {
            acc[Equipmenttype].TotalEnergyUsed = (+acc[Equipmenttype].TotalEnergyUsed + +TotalEnergyUsed).toFixed(2);
        } else {
            acc[Equipmenttype] = { ...record };
        }
        return acc;
    }, {});

    finalOutput.ElectricityVsEquipType = Object.values(result);
    return finalOutput;
}

module.exports = { calcElectricityVsEquipType }