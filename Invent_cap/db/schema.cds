namespace sustainabilitymanagement;

using {
    managed,
    sap.common
} from '@sap/cds/common';

type common25 : String(25);

entity Fuel_Category {
    key type                  : common25;
        desc                  : common25;
        carbon_emission_value : Decimal;
        unit                  : String(10);
        is_renewable          : Boolean;
}

entity uploadExcel {
    excel : LargeBinary;
}

entity equipment_type {
    key id   : String(30);
        desc : common25; //type description
}

entity Plant_Info {
    key id               : common25;
        desc             : common25;
        address          : String(100);
        city             : common25;
        region           : common25;
        country          : common25;
        postcode         : String(10);
        lattitude        : common25;
        longitude        : common25;
        virtual posvalue : String(100);
}

entity Sensor_Types {
    key id   : common25;
        desc : common25;
        unit : String(10);
}

entity Sensor_Register {
    key id                        : String(30);
        equipment_type            : Association to equipment_type;
        type                      : Association to Sensor_Types;
        equipment_no              : String(20);
        plant                     : Association to Plant_Info;
        fuel                      : Association to Fuel_Category;
        status                    : String(20);
        create_maintainance_order : Boolean default false;
        threshold_limit           : Decimal;
        lower_threshold_isactive  : Boolean;
        lower_threshold_limit     : Decimal;
        upper_threshold_isactive  : Boolean;
        upper_threshold_limit     : Decimal;
}

entity Sensor_Data : managed {
    key timestamp  : DateTime;
    key sensor     : Association to Sensor_Register;
        reading    : Decimal;
        hourlydeff : Decimal;
}

entity Sensor_Alerts : managed {
    key timestamp             : Association to Sensor_Data;
        plant                 : Association to Plant_Info;
        plant_desc            : common25;
        threshold_limit       : Decimal;
        triggered_value       : Decimal;
        equipment_no          : String(20);
        alert_status          : Association to Alert_Status;
        hourlydeff            : Decimal;
        lower_threshold_limit : Decimal;
        upper_threshold_limit : Decimal;
        order_no              : String(12);
        notification_no       : String(12);

}

// key sensor                : Association to Sensor_Register;

entity CommonCodeList : common.CodeList {
    key code : String(20);
}

entity Alert_Status : CommonCodeList {}
