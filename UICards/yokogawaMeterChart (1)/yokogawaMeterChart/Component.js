sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaMeterChart.Component", {
        onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Data": {},
                "unit": '',
                "Sensor_Register_Emission": [],
                "Sensor_Register_Entity": []
            }
            that.setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PlantSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected")
            ];
            
            Promise.all(promises).then(function (values) {
                var oContextData = {
                    "sPlant": values[0] || 'All',
                    "sYear": values[1] || '2023',
                    "sPeriod": values[2] || 'All',
                    "sEquip": values[3] || 'All',
                    "sDate": '',
                    "sMeterId": 'CPMA1003',
                    "sDimention": 'Monthly',
                };
                that.getModel("contextModel").setData(oContextData);

                var sPlant = values[0] || 'All';
                var sYear = values[1] || '2023';
                var sPeriod = values[2] || 'All';
                var sEquip = values[3] || 'All';
                var sDate = '';
                var sMeterId = 'CPMA1003';
                var sDimention = 'Monthly';
                var filters = [];

                if (sEquip.trim().length > 0 && sEquip !== 'All') {
                    filters.push("equipment_type_id eq '" + sEquip + "'");
                }

                filters.push("type_id eq 'electricity'");

				if (sPlant.trim().length > 0 && sPlant !== 'All') {
                    filters.push("plant_id eq '" + sPlant + "'");
                }

                var sQuery = filters.length > 0 ? '?$filter=' + filters.join(' and ') : '';
                // var sUrl = "/getCEValueVsMeter(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
                
                // Sensor_Register_Entity
                oCard.request({
                    "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Sensor_Register_Entity" + sQuery,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json"
                    }
                }).then(function (aData) {
                    that.getModel().setProperty("/Sensor_Register_Entity", aData.d.results);
                    if(aData.d.results.length>0){
                        that.getModel("viewModel").setProperty("/MeterSelected", aData.d.results[0].id);
                        that.getModel("contextModel").setProperty("/sMeterId", aData.d.results[0].id);

                        sMeterId = aData.d.results[0].id;
                        var sUrl1 = "/getCEValueVsMeter1(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod +  
                        "',filterDate='" + sDate + "',meterId='" + sMeterId + "',meterPeriod='" + sDimention + "')";
                        // Sensor_Register_Emission
                        oCard.request({
                            "url": "{{destinations.myDestination}}/RestService" + sUrl1,
                            "method": "GET",
                            "withCredentials": true,
                            "headers": {
                                "Accept": "application/json",
                            }
                        }).then(function (aData) {
                            that.getModel().setProperty("/Sensor_Register_Emission", aData.CEValueVsMeter[sMeterId].Monthly);
                            that.getModel().setProperty("/unit", aData.CEValueVsMeter[sMeterId].unit);
                            
                        }).catch(function(error) {
                            console.log("Meter Card " + error);
                            that.getModel().setProperty("/Sensor_Register_Emission", []);
                        });

                        var oFilterObj = {
                            "MeterSelected": sMeterId,
                            "YearSelected" : sYear,
                            "PeriodSelected" : sPeriod
                        };
                        var oEventBus = sap.ui.getCore().getEventBus();
                        oEventBus.publish("GlobalMeterFilter", "ApplyFilter", oFilterObj);

                    }else{
                        that.getModel().setProperty("/Sensor_Register_Emission", []);
                    }
                }).catch(function(error) {
                    console.log("Meter Card " + error);
                    that.getModel().setProperty("/Sensor_Register_Entity", []);
                });
                
            }).catch(function (error) {
                console.log("Meter Card " + error);
                // Handle error in any of the promises
            });
            
		}
	});

	return Component;
});
