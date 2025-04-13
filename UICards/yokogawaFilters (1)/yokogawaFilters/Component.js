sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaFilters.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
			var that = this;
            var oData = {
                "Plant_Info_Entity": [],
                "Equipment_type_Entity": []
            }
            that.setModel(new JSONModel(oData));

            // Plant_Info_Entity
            oCard.request({
                "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Plant_Info_Entity",
                "method": "GET",
                "withCredentials": true,
                "headers": {
                    "Accept": "application/json"
                }
            }).then(function (aData) {
                that.getModel().setProperty("/Plant_Info_Entity", aData.d.results);
            }).catch(function(error) {
                // alert("Error : " + JSON.stringify(error));
                console.log("Global Filter Card Error", error);
                that.getModel().setProperty("/Plant_Info_Entity", []);
            });


            var filters = [];

                filters.push("type_id eq 'electricity'");

                var sQuery = filters.length > 0 ? '?$filter=' + filters.join(' and ') : '';
            // Equipment_type_Entity
            // oCard.request({
            //     "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Equipment_type_Entity",
            //     "method": "GET",
            //     "withCredentials": true,
            //     "headers": {
            //         "Accept": "application/json"
            //     }
            oCard.request({
                "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Sensor_Register_Entity" + sQuery + "&$expand=equipment_type",
                "method": "GET",
                "withCredentials": true,
                "headers": {
                    "Accept": "application/json"
                }
            }).then(function (aData) {
                // Remove duplicates based on the 'name' property
                var uniqueEquipments = aData.d.results.filter((obj, index, self) =>
                    index === self.findIndex((o) => (
                        o.equipment_type.id === obj.equipment_type.id
                    ))
                );
                uniqueEquipments.push({"equipment_type_id": 'All', "equipment_type": {"desc": "All"}});
                that.getModel().setProperty("/Equipment_type_Entity", uniqueEquipments);
            }).catch(function(error) {
                // alert("Error : " + JSON.stringify(error));
                console.log("Global Filter Card Error", error);
                that.getModel().setProperty("/Equipment_type_Entity", []);
            });
            oCard.addStyleClass("card-height");
		}
	});

	return Component;
});
