sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, Fragment) {
	"use strict";
	return Controller.extend("yokogawaElectricityChart.Main", {
		onInit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
            var oChartType = new JSONModel({
				"aChartTypes": [
					{ "name": "Line", "key": "line", "icon": "sap-icon://line-charts"},
					{ "name": "Column", "key": "column", "icon": "sap-icon://column-chart-dual-axis"},
					{ "name": "Bar", "key": "bar", "icon": "sap-icon://bar-chart"},
					{ "name": "Waterfall", "key": "waterfall", "icon": "sap-icon://horizontal-waterfall-chart"},
					{ "name": "Radar", "key": "radar", "icon": "sap-icon://radar-chart"},
					{ "name": "Pie", "key": "pie", "icon": "sap-icon://pie-chart"},
					{ "name": "Donut", "key": "donut", "icon": "sap-icon://donut-chart"},
					{ "name": "Area", "key": "area", "icon": "sap-icon://area-chart"}
				],
				"selectedChartIcon": "sap-icon://pie-chart"
			});
			this.getView().setModel(oChartType, "chartTypeModel");
		},

        onChartTypePopover: function(oEvent){
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "yokogawaElectricityChart.DonutChartType",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			
			this._pPopover.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
			
		},

		onSelectChart: function(oEvent){
			this.getView().byId("elecEquip").setVizType(oEvent.getSource().getBindingContext("chartTypeModel").getObject().key);
			this.getView().getModel("chartTypeModel").setProperty("/selectedChartIcon", oEvent.getSource().getBindingContext("chartTypeModel").getObject().icon);
			this.getView().byId("myPopover").close();
		},

		onSaveMeterChart: function() {
			//Step 1: Export chart content to svg
			var oVizFrame = this.getView().byId("elecEquip");
			var sSVG = oVizFrame.exportToSVGString({
			  width: 800,
			  height: 600
			});
	  
			// UI5 library bug fix:
			//    Legend SVG created by UI5 library has transform attribute with extra space
			//    eg:   transform="translate (-5,0)" but it should be without spaces in string quotes
			//    tobe: transform="translate(-5,0)
			sSVG = sSVG.replace(/translate /gm, "translate");
	  
			//Step 2: Create Canvas html Element to add SVG content
			var oCanvasHTML = document.createElement("canvas");
			canvg(oCanvasHTML, sSVG); // add SVG content to Canvas
	  
			// STEP 3: Get dataURL for content in Canvas as PNG/JPEG
			var sImageData = oCanvasHTML.toDataURL("image/png");
	  
			// STEP 4: Create PDF using library jsPDF
			var oPDF = new jsPDF();
			oPDF.addImage(sImageData, "PNG", 15, 40, 180, 160);
			oPDF.save("DonutChart.pdf");
		},

        onApplyFilter: function(sChanel, sEvent, oData){
            if(sChanel === "GlobalFilter"){
                var oCard = this.getOwnerComponent().oCard;
				var that = this;
				var sPlant = oData.PlantSelected;
				var sYear = oData.YearSelected;
                var sPeriod = oData.PeriodSelected;
                var sEquip = oData.EquipmentSelected;

                var sUrl = "/getElectricityVsEquipType(year='" + sYear + "',plantid='" + sPlant + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
            
                // Sensor_Register_Emission
                oCard.request({
                    "url": "{{destinations.myDestination}}/Sustainability" + sUrl,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json",
                    }
                }).then(function (aData) {
                    that.getView().getModel().setProperty("/Equipment_Reading", aData.ElectricityVsEquipType);
                }).catch(function(error) {
                    that.getView().getModel().setProperty("/Equipment_Reading", []);
                });
            }
        },

		onExit: function() {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
		}
	});
});