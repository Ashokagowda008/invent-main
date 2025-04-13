sap.ui.define([
	"sap/ui/core/mvc/Controller",
], function (Controller) {
	"use strict";
	return Controller.extend("yokogawaEnergyKPI.Main", {
		onInit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
            const sPath = sap.ui.require.toUrl("yokogawaEnergyKPI/images/EnergyUsedKPI.png");
            this.getView().byId("energyImg").setSrc(sPath);
		},

        onApplyFilter: function(sChanel, sEvent, oData){
            if(sChanel === "GlobalFilter"){
                var oCard = this.getOwnerComponent().oCard;
				var that = this;
				var sPlant = oData.PlantSelected;
				var sYear = oData.YearSelected;
                var sPeriod = oData.PeriodSelected;
                var sEquip = oData.EquipmentSelected;

                var sUrl = "/getTotalEnergyUsed(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
                var encodedUrl = encodeURI(sUrl);
            
                // Energy_Used
                oCard.request({
                    "url": "{{destinations.myDestination}}/Sustainability" + encodedUrl,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json",
                    }
                }).then(function (aData) {
                    var value = aData.TotalEnergyUsed.TotalEnergyUsed;
                    if (value || value === 0) {
                        var stringValue = value.toString();

                        // This regex adds commas as thousands separators
                        aData.TotalEnergyUsed.TotalEnergyUsed = stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    } else {
                        // Return an empty string or handle as needed when the value is undefined or null
                        return "";
                    }
                    that.getView().getModel().setProperty("/Energy_Used", aData.TotalEnergyUsed);
                }).catch(function(error) {
                    that.getView().getModel().setProperty("/Energy_Used", []);
                });
            }
        },

        onExit: function() {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
          }
	});
});