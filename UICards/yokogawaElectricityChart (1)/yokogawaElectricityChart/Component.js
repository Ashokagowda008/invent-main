sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaElectricityChart.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Equipment_Reading": []
            }
            that.setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PlantSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected")
            ];
            
            Promise.all(promises).then(function (values) {
                var sPlant = values[0];
                var sYear = values[1];
                var sPeriod = values[2];
                var sEquip = values[3];

                var sUrl = "/getElectricityVsEquipType(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
            
                // Equipment_Reading
                oCard.request({
                    "url": "{{destinations.myDestination}}/Sustainability" + sUrl,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json",
                    }
                }).then(function (aData) {
                    that.getModel().setProperty("/Equipment_Reading", aData.ElectricityVsEquipType);
                }).catch(function(error) {
                    that.getModel().setProperty("/Equipment_Reading", []);
                });
            }).catch(function (error) {
                // Handle error in any of the promises
            });
            // oCard.getCardHeader().addStyleClass("myCardHeader");
            // oCard.addStyleClass("myCard");
		}
	});

	return Component;
});
