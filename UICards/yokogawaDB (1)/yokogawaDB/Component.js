sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaDB.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Sensor_Register_Entity": []
            }
            that.setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PlantSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected")
            ];
            
            Promise.all(promises).then(function (values) {
                var sPlant = values[0] || '';
                var sEquip = values[1] || '';
                var filters = [];

                if (sEquip && sEquip.trim().length > 0 && sEquip !== 'All') {
                    filters.push("equipment_type_id eq '" + sEquip + "'");
                }

                filters.push("type_id eq 'electricity'");

				if (sPlant && sPlant.trim().length > 0 && sPlant !== 'All') {
                    filters.push("plant_id eq '" + sPlant + "'");
                }

                var sQuery = filters.length > 0 ? '?$filter=' + filters.join(' and ') : '';
                // https://cit.workzone.cfapps.eu10.hana.ondemand.com/dynamic_dest/SustainabiltyCapDest/Sustainability
                // {{destinations.myDestination}}/odata/v2/Sustainability
                // Sensor_Register_Entity
                oCard.request({
                    "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Sensor_Register_Entity" + sQuery + "&$expand=equipment_type",
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json"
                    }
                }).then(function (aData) {
                    that.getModel().setProperty("/Sensor_Register_Entity", aData.d.results);
                }).catch(function(error) {
                    that.getModel().setProperty("/Sensor_Register_Entity", []);
                });
            }).catch(function (error) {
                // Handle error in any of the promises
            });
		}
	});

	return Component;
});
