sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaEnergyKPI.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Energy_Used": []
            }
            that.setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PlantSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/oFilters/YearSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected")
            ];
            
            Promise.all(promises).then(function (values) {
                var sPlant = values[0] || '';
                var sYear = values[1] || 2023;
                var sPeriod = values[2] || '';
                var sEquip = values[3] || '';
            
                var sUrl = "/getTotalEnergyUsed(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
                var encodedUrl = encodeURI(sUrl);
            
                // Energy_Used
                that.oCard.request({
                    "url": "https://cit.workzone.cfapps.eu10.hana.ondemand.com/dynamic_dest/SustainabiltyCapDest/Sustainability" + encodedUrl,
                    // "url": "{{destinations.myDestination}}/Sustainability" + encodedUrl,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json"
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
                    that.getModel().setProperty("/Energy_Used", aData.TotalEnergyUsed);
                }).catch(function (error) {
                    that.getModel().setProperty("/Energy_Used", {});
                    // Handle error
                });
            }).catch(function (error) {
                // Handle error in any of the promises
            });

            oCard.addStyleClass("myEnergyCard");
            oCard.getCardHeader().addStyleClass("cardHeader");
            oCard.getCardHeader().mAggregations._title.addStyleClass("headerText");
		}
	});

	return Component;
});
