using {sustainabilitymanagement as sust} from '../db/schema';

@path: '/Sustainability'
service SusService {
  type Year  : String(6);
  type Deci  : Decimal(15, 2);
  type str30 : String(30);
  type str10 : String(10);
  type str25 : String(25);
  action   deleteAll()                                                                                                                                 returns String;
  action   uploadExcel(ExcelFile : LargeBinary @Core.MediaType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileType : String) returns String;

  function getTotalEnergyUsed(year : String, plantid : String, EquipmentTypeid : String, period : String)                                              returns {
    TotalEnergyUsed : {
      Year : Year;
      TotalEnergyUsed : Deci;
      unit : str10;
    };
  };

  //  function ScreenShot(url:String)                                             returns String;


  function getTotalCEValue(year : String, plantid : String, EquipmentTypeid : String, period : String)                                                 returns {
    TotalCEValue : {
      Year : Year;
      TotalCeValue : Deci;
      DeffFromPrevValuePerc : Deci;
      DiffStatus: String(15);
      TotalPYCeValue: Deci;
      TotalCeValueinGrams : Deci;
      unit : str10;
    };
  };

  function getTotalRenewablePercEnergy(year : String, plantid : String, EquipmentTypeid : String, period : String)                                     returns {
    TotalRenewablePercEnergy : {
      Year : Year;
      TotalEnergyUsed : Deci;
      TotalRenewEnergyUsed : Deci;
      TotalRenewEnergyperc : Deci;
      unit : String(15);
    };
  };

  function getCEValueVsPlant(year : String, EquipmentTypeid : String, period : String)                                                                 returns {
    CEValueVsPlant : many {
      PlantId : str25;
      PlantName : str25;
      TotalCeValue : Deci;
      TotalCeValueinGrams : Deci;
      Year : Year;
    }
  };

  function getCEValueVsFuelType(year : String, plantid : String, EquipmentTypeid : String, period : String)                                            returns {
    CEValueVsFuelType : many {
      Fueltype : str25;
      TotalCeValue : Deci;
      TotalCeValueinGrams : Deci;
      Year : Year;
    }
  };

  function getElectricityVsEquipType(year : String, plantid : String, EquipmentTypeid : String, period : String)                                       returns {
    ElectricityVsEquipType : many {
      Equipmenttype : str30;
      Year : Year;
      TotalEnergyUsed : Deci;
      Unit : str10;
    }
  };

  function getEquipDocSet(OrderNo : String)                                                                                                            returns {
    b64 : LargeString;
    direct : LargeString
  };

  @cds.redirection.target
  entity Fuel_Category_Entity   as projection on sust.Fuel_Category;

  entity Plant_Info_Entity      as projection on sust.Plant_Info;
  entity Equipment_type_Entity  as projection on sust.equipment_type;
  entity Sensor_Types_Entity    as projection on sust.Sensor_Types;
  entity Sensor_Register_Entity as projection on sust.Sensor_Register;
  entity Sensor_Data_Entity     as projection on sust.Sensor_Data;
  entity Sensor_Alerts_Entity   as projection on sust.Sensor_Alerts;
  entity Alert_Status_Entity    as projection on sust.Alert_Status;

}

@protocol: 'rest'
@path    : '/RestService'


service RestSusService {
  // @open
  type cemtrobj {}
  function getCEValueVsMeter1(year : String, plantid : String, EquipmentTypeid : String, period : String, filterDate : String, meterId : String, meterPeriod : String) returns cemtrobj;
  function getCEValueVsMeter(year : String, plantid : String, EquipmentTypeid : String, period : String, filterDate : String)                                          returns cemtrobj;
  function getCEValueVsEquipmentType(year : String, plantid : String, EquipmentTypeid : String, period : String)                                                       returns cemtrobj;
  function getCEValueVsFuelType(year : String, plantid : String, EquipmentTypeid : String, period : String)                                                            returns cemtrobj;
  function getTotalAlertsPerPeriod(year : String, plantid : String, EquipmentTypeid : String, period : String, meterId : String ,meterPeriod : String)                                       returns cemtrobj;
  function getCalcHourlyTempWithThresholdValue(year : String, plantid : String, EquipmentTypeid : String, period : String, meterId : String, filterDate : String)      returns cemtrobj;

}
