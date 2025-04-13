sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, Fragment) {
	"use strict";
	return Controller.extend("yokogawaMeterChart.Main", {
		onInit: function () {
			this._subscribeToEventBus();
            this._initModels();
            this._fetchInitialData();
            this._setValueAxisUnit();
            this._updateSensorRegisterEmission();
		},

		onMeterSelect: function(oEvent){
			var that = this;
			this.getView().getModel("viewModel").setProperty("/MeterSelected", oEvent.getSource().getSelectedKey());
			// this._updateSensorRegisterEmission();
			this.getView().byId("meterList").setSelectedKey(oEvent.getSource().getSelectedKey());
			var oCard = this.getOwnerComponent().oCard;
			var sMeterId = oEvent.getSource().getSelectedKey();
			var sYear = this.getView().getModel("contextModel").getProperty("/sYear");
			var sPlant = this.getView().getModel("contextModel").getProperty("/sPlant");
			var sEquip = this.getView().getModel("contextModel").getProperty("/sEquip");
			var sPeriod = this.getView().getModel("contextModel").getProperty("/sPeriod");
			var sDate = this.getView().getModel("contextModel").getProperty("/sDate");
			var sDimention = this.getView().getModel("viewModel").getProperty("/PeriodSelected");;

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
				var sMeterId = oEvent.getSource().getSelectedKey();
				that.getView().getModel().setProperty("/Sensor_Register_Emission", aData.CEValueVsMeter[sMeterId][sDimention]);
				if(aData.CEValueVsMeter[sMeterId].unit){
					that.getView().getModel().setProperty("/unit", aData.CEValueVsMeter[sMeterId].unit);
					that._setValueAxisUnit(aData.CEValueVsMeter[sMeterId].unit);
				}
			}).catch(function(error) {
				console.log("Meter Card" + error);
				that.getView().getModel().setProperty("/Sensor_Register_Emission", []);
			});

			var oFilterObj = {
				"MeterSelected": oEvent.getSource().getSelectedKey(),
				"YearSelected" : sYear,
				"PeriodSelected" : sPeriod
			};
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("GlobalMeterFilter", "ApplyFilter", oFilterObj);
			
		},

		onPeriodSelect: function (oEvent) {
			var that = this;
            var periodSelected = oEvent.getSource().getSelectedKey();
            this.getView().getModel("viewModel").setProperty("/PeriodSelected", periodSelected);
            var oCard = this.getOwnerComponent().oCard;
			var sMeterId = this.getView().getModel("viewModel").getProperty("/MeterSelected");
			var sYear = this.getView().getModel("contextModel").getProperty("/sYear");
			var sPlant = this.getView().getModel("contextModel").getProperty("/sPlant");
			var sEquip = this.getView().getModel("contextModel").getProperty("/sEquip");
			var sPeriod = this.getView().getModel("contextModel").getProperty("/sPeriod");
			var sDate = this.getView().getModel("contextModel").getProperty("/sDate");
			var sDimention = oEvent.getSource().getSelectedKey();

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
				that.getView().getModel().setProperty("/Sensor_Register_Emission", aData.CEValueVsMeter[sMeterId][sDimention]);
				if(aData.CEValueVsMeter[sMeterId].unit){
					that.getView().getModel().setProperty("/unit", aData.CEValueVsMeter[sMeterId].unit);
					that._setValueAxisUnit(aData.CEValueVsMeter[sMeterId].unit);
				}
			}).catch(function(error) {
				console.log("Meter Catd" + error);
				that.getView().getModel().setProperty("/Sensor_Register_Emission", []);
			});
			
			
			// this.getView().getModel().setProperty("/Sensor_Register_Emission", this.getView().getModel().getProperty(`/Data/${this.getView().getModel("viewModel").getProperty("/MeterSelected")}/${periodSelected}`));
            this.getView().getModel().refresh(true);

            this._updatePlotAreaDataLabelVisibility(periodSelected);
        },
		
		onChartTypePopover: function(oEvent){
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "yokogawaMeterChart.ChartType",
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
			var chartKey = oEvent.getSource().getBindingContext("chartTypeModel").getObject().key;
            this.getView().byId("MeterChart").setVizType(chartKey);
			this.getView().getModel("chartTypeModel").setProperty("/selectedChartIcon", oEvent.getSource().getBindingContext("chartTypeModel").getObject().icon);
			this.getView().byId("myPopover").close();
			if(chartKey == 'line'){
				this.getView().byId("MeterChart").setVizProperties({
					plotArea: {
						dataPointStyle: {
							"rules":
							[
								{
									"dataContext": {"Reading": {"max": 450000}},
									"properties": {
										"color":"sapUiChartPaletteSemanticGood"
									},
									"displayName":"Under Threshold"
								}
							],
							"others":
							{
								"properties": {
									 "color": "sapUiChartPaletteSequentialHue2"
								},
								"displayName": "Reading > 450000"
							}
						}
					}
				});
	
			}else{
				this.getView().byId("MeterChart").setVizProperties({
					plotArea: {
						dataPointStyle: {
							"rules":
							[
								{
									"dataContext": {"Reading": {"max": 450000}},
									"properties": {
										"color":"sapUiChartPaletteSemanticGood"
									},
									"displayName":"Under Threshold"
								}
							],
							"others":
							{
								"properties": {
									 "color": "sapUiChartPaletteSemanticBad"
								},
								"displayName": "Reading > 450000"
							}
						}
					}
				});
	
			}
		},

		onSaveMeterChart: function() {
			//Step 1: Export chart content to svg
			var oVizFrame = this.getView().byId("MeterChart");
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
			oPDF.save("MeterChart.pdf");
		},

        onApplyFilter: function(sChanel, sEvent, oData){
			var that = this;
            if(sChanel === "GlobalFilter"){
				var sMeterId = this.getView().getModel("viewModel").getProperty("/MeterSelected");
				var sDate = this.getView().getModel("contextModel").getProperty("/sDate");
				var sDimention = this.getView().getModel("viewModel").getProperty("/PeriodSelected");
				
                var oCard = this.getOwnerComponent().oCard;
				var that = this;
				var sPlant = oData.PlantSelected;
				this.getView().getModel("contextModel").setProperty("/sPlant", sPlant);
				var sYear = oData.YearSelected;
				this.getView().getModel("contextModel").setProperty("/sYear", sYear);
                var sPeriod = oData.PeriodSelected !== 'All' ? oData.PeriodSelected : 'All';
				this.getView().getModel("contextModel").setProperty("/sPeriod", sPeriod);
                var sEquip = oData.EquipmentSelected;
				this.getView().getModel("contextModel").setProperty("/sEquip", sEquip);
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
                    "url": "{{destinations.myDestination}}/odata/v2/Sustainability/Sensor_Register_Entity" + sQuery,
                    "method": "GET",
                    "withCredentials": true,
                    "headers": {
                        "Accept": "application/json"
                    }
                }).then(function (aData) {
                    that.getView().getModel().setProperty("/Sensor_Register_Entity", aData.d.results);
					if(aData.d.results.length>0){
						that.getView().getModel("viewModel").setProperty("/MeterSelected", aData.d.results[0].id);
						that.getView().getModel().refresh(true);
						that.getView().getModel("viewModel").refresh(true);
						that.getView().getModel("contextModel").setProperty("/sMeterId", aData.d.results[0].id);

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
							that.getView().getModel().setProperty("/Sensor_Register_Emission", aData.CEValueVsMeter[sMeterId][sDimention]);
						}).catch(function(error) {
							that.getView().getModel().setProperty("/Sensor_Register_Emission", []);
						});
						
					}else{
						that.getView().getModel().setProperty("/Sensor_Register_Emission", []);
					}
					var oFilterObj = {
						"MeterSelected": aData.d.results.length>0 ? aData.d.results[0].id : 'none',
						"YearSelected" : sYear,
						"PeriodSelected" : sPeriod
					};
					var oEventBus = sap.ui.getCore().getEventBus();
					oEventBus.publish("GlobalMeterFilter", "ApplyFilter", oFilterObj);
				}).catch(function(error) {
                    that.getView().getModel().setProperty("/Sensor_Register_Entity", []);
                });

				if(['Q1', 'Q2', 'Q3', 'Q4'].includes(sPeriod)){
					var PeriodData = [
						{ "Name": "Days" },
						{ "Name": "Monthly" },
						{ "Name": "Quarterly" }
					]
					this.getView().getModel("viewModel").setProperty("/PeriodData", PeriodData);
				}else if(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(sPeriod)){
					var PeriodData = [
						{ "Name": "Days" },
						{ "Name": "Monthly" }
					]
					this.getView().getModel("viewModel").setProperty("/PeriodData", PeriodData);
				}else{
					var PeriodData = [
						{ "Name": "Days" },
						{ "Name": "Monthly" },
						{ "Name": "Quarterly" },
						{ "Name": "Yearly" }
					]
					this.getView().getModel("viewModel").setProperty("/PeriodData", PeriodData);
				}
            }
        },

		// Private methods
        _subscribeToEventBus: function () {
            sap.ui.getCore().getEventBus().subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
        },

		_initModels: function () {
            var objData = {
				"PeriodData": [
					{ "Name": "Days" },
					{ "Name": "Monthly" },
					{ "Name": "Quarterly" }
				],
				"PeriodSelected": "Monthly",
				"MeterSelected": this.getView().getModel().getProperty("/Sensor_Register_Entity/0/id")
			};
			var oChartType = new JSONModel({
				"aChartTypes": [
					{ "name": "Line", "key": "line", "icon": "sap-icon://line-charts"},
					{ "name": "Column", "key": "column", "icon": "sap-icon://column-chart-dual-axis"},
					{ "name": "Bar", "key": "bar", "icon": "sap-icon://bar-chart"},
					{ "name": "Area", "key": "area", "icon": "sap-icon://area-chart"}
				],
				"selectedChartIcon": "sap-icon://line-charts"
			});
			this.getView().setModel(oChartType, "chartTypeModel");
			this.getView().getModel("viewModel").setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.getView().getModel("viewModel").setData(objData);
			this.getView().getModel().setProperty("unit", 'kg');
        },

		_setValueAxisUnit: function(sUnit){
			this.getView().byId("MeterChart").setVizProperties({
                plotArea: {
					valueAxis: {
						title: {
							text: "CO2e Emissions(" + sUnit + ")",
							visible: true
						}
					}
                }
            });
		},

        _fetchInitialData: function () {
            var oCard = this.getOwnerComponent().oCard;
            oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected").then((value) => {
                if (value && value.trim().length > 0) {
                    this.getView().getModel("viewModel").setProperty("/PeriodData", [
                            { "Name": "Days" },
                            { "Name": "Monthly" },
                            { "Name": "Quarterly" }
                        ]);
                }
            });
        },

        _updateSensorRegisterEmission: function (meterId) {
            var selectedMeterId = meterId || this.getView().getModel("viewModel").getProperty("/MeterSelected");
			this.getView("viewModel").getModel().refresh(true);
            // this.getView().getModel().setProperty("/Sensor_Register_Emission", this.getView().getModel().getProperty(`/Data/${selectedMeterId}/${this.getView().getModel("viewModel").getProperty("/PeriodSelected")}`));
        },

        _updatePlotAreaDataLabelVisibility: function (periodSelected) {
            if (periodSelected === 'Days') {
                this.getView().byId("MeterChart").setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: false
                        }
                    }
                });
            } else {
                this.getView().byId("MeterChart").setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: true
                        }
                    }
                });
            }
        },

		onExit: function() {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
		}
	});
});


        