sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter"],
    function (Controller, History, Spreadsheet, exportLibrary,Filter,FilterOperator, formatter) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return Controller.extend("purchasinginfo.controller.LogFile", {
            formatter: formatter,
            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("logs").attachPatternMatched(this._onMatched, this);
            },
            _onMatched: function (oEvent) {
                var that = this;
                var oArgs = oEvent.getParameter("arguments");
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);
                // this.appModulePath = ""
                $.ajax({
                    url: this.appModulePath + "/purchasinginfoservice/GetLogs()",
                    method: "GET",
                    async: false,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                       
                        let finalData = result.value.filter(message => message.message != "");
                        var oModel = new sap.ui.model.json.JSONModel();
                        var dData = {
                            results: finalData
                        }
                        oModel.setSizeLimit(9999)
                        oModel.setData(dData);
                        that.getView().setModel(oModel);

                    },
                    error: function (result, xhr, data) {
                        var dData = {
                            results: []
                        }
                        var oModel = new sap.ui.model.json.JSONModel();
                        oModel.setData(dData);
                        that.getView().setModel(oModel);
                    }
                })
            },
            onSearch: function (oEvent) {
                if (oEvent.getParameters().refreshButtonPressed) {
                    this.onRefresh();
                } else {
                    var aTableSearchState = [];
                    var sQuery = oEvent.getParameter("query");
                        if (sQuery && sQuery.length > 0) {
                        aTableSearchState = [new Filter("message", FilterOperator.Contains, sQuery)];
                    }
                    this._applySearch(aTableSearchState);
                }
    
            },
            onRefresh: function () {
                var oTable = this.byId("idTable");
                oTable.getBinding("items").refresh();
            },
            _applySearch: function (aTableSearchState) {
                var oTable = this.byId("idTable");
                 oTable.getBinding("items").filter(aTableSearchState, "Application");
            },
            onBack: function () {
                var sPreviousHash = History.getInstance().getPreviousHash();
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.getOwnerComponent().getRouter().navTo("worklist", null, true);
                }
            },

            createColumnConfig: function () {
                var aCols = [];

                aCols.push({
                    label: "Message",
                    property: 'message',
                    type: EdmType.String
                });
                return aCols;
            },


            onExportXSLX: function () {
                var aCols, oRowBinding, oSettings, oSheet, oTable;

                if (!this._oTable) {
                    this._oTable = this.byId('idTable');
                }

                oTable = this._oTable;
                oRowBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();

                oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: oRowBinding,
                    fileName: 'Logs.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {

                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            }

        });
    });
