sap.ui.define([
	"sap/ui/core/mvc/Controller",
], function (Controller) {
	"use strict";
	return Controller.extend("yokogawaFilters.Main", {
		onInit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalMapFilter", "ApplyFilter", this.onApplyFilter, this);
			var that = this;
			var oCard = this.getOwnerComponent().oCard;
			var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PlantSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected"),
				oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected")
                
            ];
            Promise.all(promises).then(function (values) {
				var objData = {
					"YearData": [
						{ "Year": "2024" },
						{ "Year": "2023" },
						{ "Year": "2022" },
						{ "Year": "2021" }
					],
					"PeriodData": [
						{ "Name": "All", "key": "" },
						{ "Name": "First Quarter", "key": "Q1" },
						{ "Name": "Second Quarter", "key": "Q2" },
						{ "Name": "Third Quarter", "key": "Q3" },
						{ "Name": "Fourth Quarter", "key": "Q4" },
						{ "Name": "January", "key": "jan" },
						{ "Name": "February", "key": "feb" },
						{ "Name": "March", "key": "mar" },
						{ "Name": "April", "key": "apr" },
						{ "Name": "May", "key": "may" },
						{ "Name": "June", "key": "jun" },
						{ "Name": "July", "key": "jul" },
						{ "Name": "August", "key": "aug" },
						{ "Name": "September", "key": "sep" },
						{ "Name": "October", "key": "oct" },
						{ "Name": "November", "key": "nov" },
						{ "Name": "December", "key": "dec" }
					],
					"YearSelected": values[1].length > 0 ? values[1] : "2023",
					"PlantSelected": values[0],
					"EquipmentSelected": 'All',
					"PeriodSelected": values[3]
				};
				var oViewModel = new sap.ui.model.json.JSONModel(objData);
				oViewModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				that.getView().setModel(oViewModel, "viewModel");

            }).catch(function (error) {
                // Handle error in any of the promises
				console.log("Global Filter Card Error", error);
				
            });
			
		},
		onEventBusFilter: function(){
			var oFilterObj = {
				"YearSelected": this.getView().getModel("viewModel").getProperty("/YearSelected"),
				"PlantSelected": this.getView().getModel("viewModel").getProperty("/PlantSelected"),
				"EquipmentSelected": this.getView().getModel("viewModel").getProperty("/EquipmentSelected"),
				"PeriodSelected": this.getView().getModel("viewModel").getProperty("/PeriodSelected")
			};
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("GlobalFilter", "ApplyFilter", oFilterObj);
		},

		onApplyFilter: function(sChanel, sEvent, oData){
            if(sChanel === "GlobalMapFilter"){
                var oCard = this.getOwnerComponent().oCard;
				this.getView().getModel("viewModel").setProperty("/PlantSelected", oData.PlantSelected);
				this.onEventBusFilter();
            }
        },

		onExit: function() {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("GlobalMapFilter", "ApplyFilter", this.onApplyFilter, this);
		}

		// onFilter: function(){
		// 	var that = this;
		// 	var oCard = this.getOwnerComponent().oCard;
		// 	oCard.triggerAction({
        //         type: "updateContext",
        //         parameters: {
        //             "namespace": "sap.yokogawa",
        //             "context": {
		// 				"oFilters": {
		// 					"YearSelected": that.getView().getModel("viewModel").getProperty("/YearSelected"),
		// 					"PlantSelected": that.getView().getModel("viewModel").getProperty("/PlantSelected"),
		// 					"EquipmentSelected": that.getView().getModel("viewModel").getProperty("/EquipmentSelected"),
		// 					"PeriodSelected": that.getView().getModel("viewModel").getProperty("/PeriodSelected")
		// 				}
        //             }
        //         }
        //     });
		// 	// that.getView().getModel("viewModel").refresh(true);
		// }
	});
});