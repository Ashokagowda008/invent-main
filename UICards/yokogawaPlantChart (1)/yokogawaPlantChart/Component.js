sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaPlantChart.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Plant_Emissions_Entity": []
            }
            that.setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected")
            ];
            
            Promise.all(promises).then(function (values) {
                var sYear = values[0];
                var sPeriod = values[1];
                var sEquip = values[2];

                sEquip = sEquip == 'All' ? '' : sEquip;
                var sUrl = "getCEValueVsPlant(year='" + sYear + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
                var encodedUrl = encodeURI(sUrl);
            
                // Plant_Emissions_Entity
                oCard.request({
                    "url": "{{destinations.myDestination}}/Sustainability/" + encodedUrl,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json",
                    }
                }).then(function (aData) {
                    that.getModel().setProperty("/Plant_Emissions_Entity", aData.CEValueVsPlant);
                }).catch(function(error) {
                    that.getModel().setProperty("/Plant_Emissions_Entity", []);
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
