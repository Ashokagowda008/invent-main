sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, Fragment) {
	"use strict";
	return Controller.extend("yokogawaPlantChart.Main", {
		onInit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
            var oChartType = new JSONModel({
				"aChartTypes": [
					{ "name": "Column", "key": "column", "icon": "sap-icon://column-chart-dual-axis"},
					{ "name": "Bar", "key": "bar", "icon": "sap-icon://bar-chart"},
				],
				"selectedChartIcon": "sap-icon://column-chart-dual-axis"
			});
			this.getView().setModel(oChartType, "chartTypeModel");
			this._setInitialVizProperties();
		},

		onChartTypePopover: function(oEvent){
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "yokogawaPlantChart.PlantChartType",
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
			this.getView().byId("plantChart").setVizType(oEvent.getSource().getBindingContext("chartTypeModel").getObject().key);
			this.getView().getModel("chartTypeModel").setProperty("/selectedChartIcon", oEvent.getSource().getBindingContext("chartTypeModel").getObject().icon);
			this.getView().byId("myPopover").close();
		},

		onSaveChart: function() {
			//Step 1: Export chart content to svg
			var oVizFrame = this.getView().byId("plantChart");
			var sSVG = oVizFrame.exportToSVGString({
			  width: 800,
			  height: 600
			});
			
			sSVG = sSVG.replace(/translate /gm, "translate");
	  
			//Step 2: Create Canvas html Element to add SVG content
			var oCanvasHTML = document.createElement("canvas");
			canvg(oCanvasHTML, sSVG); // add SVG content to Canvas
	  
			// STEP 3: Get dataURL for content in Canvas as PNG/JPEG
			var sImageData = oCanvasHTML.toDataURL("image/png");
	  
			// STEP 4: Create PDF using library jsPDF
			var oPDF = new jsPDF();
			oPDF.addImage(sImageData, "PNG", 15, 40, 180, 160);
			oPDF.save("PlantChart.pdf");
		},

        onApplyFilter: function(sChanel, sEvent, oData){
            if(sChanel === "GlobalFilter"){
                var oCard = this.getOwnerComponent().oCard;
				var that = this;
				var sYear = oData.YearSelected;
                var sPeriod = oData.PeriodSelected;
                var sEquip = oData.EquipmentSelected;

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
                    that.getView().getModel().setProperty("/Plant_Emissions_Entity", aData.CEValueVsPlant);
                }).catch(function(error) {
                    that.getView().getModel().setProperty("/Plant_Emissions_Entity", []);
                });
            }
        },

        _setInitialVizProperties: function () {
            this.getView().byId("plantChart").setVizProperties({
                plotArea: {
                    dataPointStyle: {
                        "rules": [
                            {
                                "dataContext": { "Plant": "Werk 1 - DE" },
                                "properties": {
                                    "color": "#0070F2"
                                }
                            },
							{
                                "dataContext": { "Plant": "Plant-Man-IN" },
                                "properties": {
                                    "color": "#C87B00"
                                }
                            }
                        ],
                        "others": {
                            "properties": {
                                "color": "#75980B"
                            }
                        }
                    }
                }
            });
        },

		onExit: function() {
		  var oEventBus = sap.ui.getCore().getEventBus();
		  oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
		}
	});
});