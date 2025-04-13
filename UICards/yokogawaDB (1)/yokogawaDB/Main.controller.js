sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
	"use strict";
	return Controller.extend("yokogawaDB.Main", {
		onInit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
			const sPath = sap.ui.require.toUrl("yokogawaDB/images/meter.png");
			var oImages = {
                "meter": sPath
            }
            this.getView().setModel(new JSONModel(oImages), "imageModel");
		},
		 
		onMeterPress: function(oEvent){
			var sensor = "('" + oEvent.getSource().getBindingContext().getObject().id + "')";
			var oCard = this.getOwnerComponent().oCard;
			oCard.triggerAction({
				type: "Navigation",
				"parameters": {
					"url": "https://cit.workzone.cfapps.eu10.hana.ondemand.com/site#yokogawaapp-display?sap-app-origin-hint=&/sensor" + sensor
				}
				// "parameters": {
				// 	"ibnTarget": {
				// 		"semanticObject": "yokogawaapp",
				// 		"action": "display"
				// 	},
				// 	"ibnParams": {
                //             tab: 'sensor'
				// 	}
				// }
			});
		},

        onApplyFilter: function(sChanel, sEvent, oData){
            if(sChanel === "GlobalFilter"){
                var oCard = this.getOwnerComponent().oCard;
				var that = this;
				var sPlant = oData.PlantSelected || '';
                var sEquip = oData.EquipmentSelected || '';
                var filters = [];

                if (sEquip.trim().length > 0 && sEquip !== 'All') {
                    filters.push("equipment_type_id eq '" + sEquip + "'");
                }

				filters.push("type_id eq 'electricity'");

				if (sPlant.trim().length > 0 && sPlant !== 'All') {
                    filters.push("plant_id eq '" + sPlant + "'");
                }

                var sQuery = filters.length > 0 ? '?$filter=' + filters.join(' and ') : '';
				// Sensor_Register_Entity
                oCard.request({
                    "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Sensor_Register_Entity" + sQuery + "&$expand=equipment_type",
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json"
                    }
                }).then(function (aData) {
                    that.getView().getModel().setProperty("/Sensor_Register_Entity", aData.d.results);
                }).catch(function(error) {
                    that.getView().getModel().setProperty("/Sensor_Register_Entity", []);
                });
            }
        },

		statusColorFormatter: function (sStatus) {
			switch (sStatus) {
			  case 'Online':
				return 'Success'; // You can define CSS classes for different statuses
			  case 'InActive':
				return 'Warning';
			  case 'Offline':
				return 'Error';
			  default:
				return 'Information';
			}
		},
		statusIconFormatter: function (sStatus) {
			switch (sStatus) {
			  case 'Good':
				return "sap-icon://sys-enter-2"; // You can define CSS classes for different statuses
			  case 'InActive':
				return 'sap-icon://alert';
			  case 'Ofline':
				return 'sap-icon://error';
			  default:
				return 'sap-icon://information';
			}
		},
		onExit: function() {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
		}
	});
});