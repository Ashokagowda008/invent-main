sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/MessageBox"

],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (Controller, JSONModel, Label, Text, Column, ColumnListItem, MessageBox) {
        "use strict";

        return Controller.extend("bidcomparision.controller.BidComparisionReport", {
            onInit: function () {
               var oData = {
                    data: []
                 }
                var oModel1 = new JSONModel(oData);
                this.getView().setModel(oModel1);
                this.initialComlumns = [
                    { field: "Item Name", type: "str", width: "12rem" },
                    { field: "Field Name", type: "str", width: "8rem" },
                    { field: "Quantity", type: "num", width: "4rem" },
                    { field: "Unit", type: "str", width: "3rem" }];
                this.FieldLabels = [{ field: "Price", title: "PRICE" },
                { field: "Extended Price", title: "EXTENDEDPRICE" },
                { field: "Savings", title: "SAVINGS" },
                { field: "Item Rank", title: "bidRank" },
                { field: "Lead Bid %", title: "Perc" }];
                this.TotalFields = ["Total (Extended Price)", "Total (Savings)",
                    "% difference from lead bid total (100% participation)",
                    "% difference from lead bid total",
                    "Item Participation %"];
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);
                this.getAccessToken();
            },
            getAccessToken: function () {
                sap.ui.core.BusyIndicator.show();
                var that = this;
                var url = this.appModulePath + "/ariba_token/v2/oauth/token?grant_type=openapi_2lo";
                $.ajax({
                    url: url,
                    method: "POST",
                    contentType: "application/json",
                    async: true,
                    success: function (odata, jQXHR, status) {
                        that.accessToken = odata.access_token;
                        that.requestcount = 3;
                        // that.getPendingEvents();
                        
                        that.getItems();
                        that.getItemsResponse();
                        that.getInvitedSuppliers();
                        
                    },
                    error: function (error, jQXHR) {
                        MessageBox.error("Token not found");
                    }
                });
            },
            selectEventDialog: function(data){
                 if (!this.eventDialog) {
                    this.eventDialog = sap.ui.xmlfragment("bidcomparision.view.Event", this);
                    this.getView().addDependent(this.eventDialog);
                }
             var dialog = new sap.m.Dialog({
				title: 'Select Event',
                type: 'Message',
                titleAlignment:"Center",
				content: this.eventDialog,
				beginButton: new sap.m.Button({
					type: "Emphasized",
					text: 'OK',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
            }).addStyleClass("sapUiSizeCompact");
             var oModel = new JSONModel(data); 
             dialog.setModel(oModel,"Events")
			dialog.open();
            },
            getPendingEvents: function () {
                var g = this;
                var reportUrl = g.appModulePath + "/ariba_report/api/sourcing-approval/v2/prod/pendingApprovables?realm=cumulus8-T&documentType=RFXDocument";
                $.ajax({
                    url: reportUrl,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + g.accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        var tempArray = [];
                        if (odata.length > 0) {
                            //   odata.forEach((item) => {
                            //     //   if(item.description === ""){
                            //         tempArray.push(item);
                            //     //   }
                            //   });
                              tempArray.unshift({
                                  uniqueName:"(Select)"
                                })
                             var oModel = new JSONModel(tempArray); 
                            g.getView().setModel(oModel, "Events");
                        } else {
                            if (g.getView().getModel("Events")) {
                                g.getView().getModel("Events").setData([]);
                            }
                            MessageBox.error("No Pending Events");
                        }
                        g.selectEventDialog(tempArray);
                     },
                    error: function (error) {
                        MessageBox.error("No Pending Events");
                    }
                });
            },
            getDocInfo: function () {
                var g = this;
                var reportUrl = g.appModulePath + "/ariba_report/api/sourcing-approval/v2/prod/Task/TSK242019025?realm=cumulus8-T";
                $.ajax({
                    url: reportUrl,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + g.accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        console.log(odata);
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            },
            getItems: function () {
                var g = this;
                var reportUrl = g.appModulePath + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/Doc259020677?realm=cumulus8-T&$select=items"
                $.ajax({
                    url: reportUrl,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + g.accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        var oModel = new JSONModel(odata);

                        if (odata) {
                            g.getView().setModel(oModel, "ItemsData");
                        } else {
                            if (g.getView().getModel("ItemsData")) {
                                g.getView().getModel("ItemsData").setData([]);
                            }
                            MessageBox.error("Items Details not found");
                        }
                        g.closeBusyIndicator();
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        if (g.getView().getModel("ItemsData")) {
                            g.getView().getModel("ItemsData").setData([]);
                        }
                        MessageBox.error("Items Details not found");
                    }
                });
            },
            getItemsResponse: function () {
                var g = this;
                var reportUrl = this.appModulePath + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/Doc259020677?realm=cumulus8-T&$select=itemResponses"
                $.ajax({
                    url: reportUrl,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + g.accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        var oModel = new JSONModel(odata);

                        if (odata) {
                            if (g.getView().getModel("ItemsResponseData")) {
                                g.getView().getModel("ItemsResponseData").setData([]);
                            }
                            g.getView().setModel(oModel, "ItemsResponseData");
                        } else {
                            MessageBox.error("Items response not found");
                        }
                        g.closeBusyIndicator();
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        if (g.getView().getModel("ItemsResponseData")) {
                            g.getView().getModel("ItemsResponseData").setData([]);
                        }
                        MessageBox.error("Items response not found ");
                    }
                });
            },
            getInvitedSuppliers: function () {
                var g = this;
                var reportUrl = this.appModulePath + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/Doc259020677?realm=cumulus8-T&$select=invitedSuppliers"
                $.ajax({
                    url: reportUrl,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + g.accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        var oModel = new JSONModel(odata);
                        if (odata) {
                            g.getView().setModel(oModel, "VendorsData");
                        } else {
                            if (g.getView().getModel("VendorsData")) {
                                g.getView().getModel("VendorsData").setData([]);
                            }
                            MessageBox.error("Supplier Details not loaded ");
                        }
                        g.closeBusyIndicator();
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        if (g.getView().getModel("VendorsData")) {
                            g.getView().getModel("VendorsData").setData([]);
                        }
                        MessageBox.error("Supplier Details not loaded ");
                    }
                });
            },
            closeBusyIndicator: function () {
                this.requestcount--
                if (this.requestcount === 0) {
                    sap.ui.core.BusyIndicator.hide();
                    this.setTableData();
                }

            },
            setTableData: function () {
                let oTable = this.getView().byId("idMyTable");
                let ItemsResponseData = this.getView().getModel("ItemsResponseData").getData().itemResponses;
                let VendorsData = this.getView().getModel("VendorsData").getData().invitedSuppliers;
                this.updateColumn(ItemsResponseData, VendorsData);
                const key = 'field';
                const arrayColumnsByKey = [...new Map(this.initialComlumns.map(item => [item[key], item])).values()];
                let initialComlumns = arrayColumnsByKey;
                //Adding Columns to the Table
                var oColumn = "";
                for (var i = 0; i < initialComlumns.length; i++) {
                    if (initialComlumns[i].field === "Item Name") {
                        oColumn = new Column({
                            mergeDuplicates: true,
                            minScreenWidth: "Tablet",
                            demandPopin: true,
                            header: new Text({
                                text: initialComlumns[i].field

                            }).addStyleClass("myFontSize"),
                            width: initialComlumns[i].width,
                        });
                    } else if (initialComlumns[i].type === "obj") {
                        oColumn = new Column({
                            hAlign: "End",
                            minScreenWidth: "Small",
                            demandPopin: true,
                            header: new Label({
                                design: "Bold",
                                wrapping: true,
                                text: initialComlumns[i].field
                            },
                            ).addStyleClass("myFontSize"),
                            width: initialComlumns[i].width
                        });
                    } else {
                        oColumn = new Column({
                            minScreenWidth: "Small",
                            demandPopin: true,
                            header: new Label({
                                text: initialComlumns[i].field
                            }).addStyleClass("myFontSize"),
                            width: initialComlumns[i].width
                        });
                    }
                    var oCells = [];
                    oTable.addColumn(oColumn);
                };
                this.updateTotal();
                //Binding Model and Cell Template to the Table
                var obj = this.getView().getModel().getData().data[0];
                for (let key in obj) {
                    var cell = '{' + key + '}';
                    if (key !== "Currency" && key !== "itemresponse") {
                        // if(key === "ItemName"){
                        oCells.push(
                            new sap.m.Label({
                                wrapping: true,
                                design: "{=${ItemName} === 'Total (Extended Price)' || ${ItemName} === 'Total (Savings)' ? 'Bold' : 'Standard'}",
                                text: cell
                            }))
                        // } else{
                        //     oCells.push(new sap.m.Label({
                        //         wrapping: true,
                        //         design: "Standard",
                        //         text: cell
                        //     }));  
                        // }                            
                    }
                }
                var oTemplate = new ColumnListItem({
                    cells: oCells
                });
                oTable.bindItems("/data", oTemplate);
            },
            updateColumn: function (ItemsResponseData, VendorsData) {
                var tempItems = [];
                var ItemResponse = [];
                var oModel = this.getView().getModel("ItemsData").getData().items;
                oModel.forEach((items) => {
                    if (items.itemType === "Line Item") {
                        items.ItemsResponse = [];
                        ItemResponse = [];
                        ItemsResponseData.forEach((itemsresponse) => {
                            if (items.itemId === itemsresponse.item.itemId) {
                                ItemResponse.push(itemsresponse);
                                VendorsData.forEach((Vendors) => {
                                    if (Vendors.organization.systemID === itemsresponse.orgSystemId) {
                                        itemsresponse.SupplierName = Vendors.organization.name;
                                        this.initialComlumns.push({ field: Vendors.organization.name, type: "obj", width: "auto" });
                                    }
                                });
                            }
                        });
                        items.ItemsResponse = ItemResponse;
                        tempItems.push(items);
                    }
                });
                this.setRowItems(tempItems);
            },
            setRowItems: function (tempItems) {
                var oData = this.getView().getModel().getData().data;
                var aitems = {}
                var mainLineItem = [];
                tempItems.forEach((item) => {
                    aitems = {}
                    aitems.ItemName = item.title;
                    aitems.FieldName = "";
                    aitems.Currency = "";
                    item.terms.forEach((term) => {
                        if (term.fieldId === "QUANTITY") {
                            aitems.Quantity = term.value.quantity,
                                aitems.UOM = term.value.uom
                        }
                    });
                    aitems["itemresponse"] = item.ItemsResponse;
                    item.ItemsResponse.forEach((itemresponse, Index) => {
                        aitems["Supplier" + Index] = "";
                    });
                    oData.push(aitems);
                    var EXTPRICE = [];
                    for (var i = 0; i < this.FieldLabels.length; i++) {
                        var LineItem = $.extend({}, aitems);
                        // var LineItem = {};                        
                        LineItem.Quantity = "";
                        LineItem.UOM = "";
                        LineItem.FieldName = this.FieldLabels[i].field;
                        item.ItemsResponse.forEach((itemresponse, Index) => {
                            itemresponse.item.terms.forEach((term, idx) => {
                                if (this.FieldLabels[i].title === "PRICE" && term.fieldId === "PRICE") {
                                    LineItem["Supplier" + Index] = term.value.amount ? "$" + term.supplierValue.amount.toFixed(2) : "$" + "0.00";
                                    LineItem.Currency = term.value.currency;
                                } else if (this.FieldLabels[i].title === "EXTENDEDPRICE" && term.fieldId === "EXTENDEDPRICE") {
                                    EXTPRICE.push(term.supplierValue.amount);
                                    LineItem["Supplier" + Index] = term.supplierValue.amount ? "$" + term.supplierValue.amount.toFixed(2) : "$" + "0.00";
                                    LineItem.Currency = term.value.currency;
                                }
                                else if (this.FieldLabels[i].title === "SAVINGS" && term.fieldId === "SAVINGS") {
                                    LineItem["Supplier" + Index] = term.value.amount ? "$" + term.value.amount.toFixed(2) : "$" + "0.00";
                                    LineItem.Currency = term.value.currency;
                                } else if (this.FieldLabels[i].title === "bidRank") {
                                    LineItem["Supplier" + Index] = itemresponse.bidRank;
                                }
                            });
                            if (this.FieldLabels[i].title === "Perc") {
                                EXTPRICE.forEach((Value, idx) => {
                                    var Property = 'Supplier' + idx;
                                    if (LineItem[Property] === "") {
                                        var minValue = Math.min(...EXTPRICE);
                                        let lineValue = Value ? Value : 0;
                                        let deff = lineValue - minValue
                                        let FinalValue = deff > 0 ? (deff / Value) * 100 : 0;
                                        LineItem[Property] = FinalValue > 0 ? FinalValue.toFixed(2) + "%" : "0.00%";
                                    }
                                });
                            }
                        });
                        oData.push(LineItem);
                    }
                });
                // var oModel = new JSONModel(oData);
                // this.getView().setModel(oModel);
                // this.updateRows(oData);
            },
            updateTotal: function () {
                var oData = this.getView().getModel().getData().data;
                var EXTENDEDPRICE = [];
                this.TotalFields.forEach((Totals, Index) => {
                    var aitem = {};
                    aitem.ItemName = Totals;
                    aitem.FieldName = "";
                    aitem.Currency = "USD";
                    aitem.Quantity = "";
                    aitem.UOM = "";
                    oData.forEach((item) => {
                        if (item.itemresponse) {
                            var totalSupplier = item.itemresponse.length;
                            item.itemresponse.forEach((itemresponse, Index, array) => {
                                if (Totals === "Total (Extended Price)" && item.FieldName === "Extended Price") {
                                    itemresponse.item.terms.forEach((term, idx) => {
                                        if (term.fieldId === "EXTENDEDPRICE") {
                                            var Property = 'Supplier' + Index;
                                            if (aitem.hasOwnProperty(Property)) {
                                                if (Index === parseInt(Property.charAt(Property.length - 1))) {
                                                    var itemValue = aitem["Supplier" + Index] ? parseInt(aitem["Supplier" + Index].replace("$", "")) : 0.00;
                                                    aitem["Supplier" + Index] = term.supplierValue.amount ? term.supplierValue.amount + itemValue : 0 + itemValue;
                                                    EXTENDEDPRICE.push(term.supplierValue.amount ? term.supplierValue.amount + itemValue : 0 + itemValue);
                                                    aitem["Supplier" + Index] = "$" + aitem["Supplier" + Index].toFixed(2);
                                                }
                                            } else {
                                                aitem["Supplier" + Index] = term.supplierValue.amount ? "$" + term.supplierValue.amount.toFixed(2) : "$" + "0.00";
                                            }
                                        }
                                    });
                                    // });
                                } else if (Totals === "Total (Savings)" && item.FieldName === "Savings") {
                                    //    item.itemresponse.forEach((itemresponse, Index, array) => {
                                    itemresponse.item.terms.forEach((term, idx) => {
                                        if (term.fieldId === "SAVINGS") {
                                            var Property = 'Supplier' + Index;
                                            if (aitem.hasOwnProperty(Property)) {
                                                if (Index === parseInt(Property.charAt(Property.length - 1))) {
                                                    var itemValue = aitem["Supplier" + Index] ? parseInt(aitem["Supplier" + Index].replace("$", "")) : 0.00;
                                                    aitem["Supplier" + Index] = term.value.amount ? term.value.amount + itemValue : 0 + itemValue;
                                                    aitem["Supplier" + Index] = "$" + aitem["Supplier" + Index].toFixed(2);
                                                }
                                            } else {
                                                aitem["Supplier" + Index] = term.value.amount ? "$" + term.value.amount.toFixed(2) : "$" + "0.00";
                                            }
                                        }
                                    });
                                    // });
                                } else if (Totals === "% difference from lead bid total (100% participation)" || Totals === "% difference from lead bid total") {
                                    // item.itemresponse.forEach((itemresponse, Index, array) => {
                                    EXTENDEDPRICE.forEach((Value, idx) => {
                                        var Property = 'Supplier' + idx;
                                        if (!aitem.hasOwnProperty(Property)) {
                                            var MinValue = Math.min(...EXTENDEDPRICE);
                                            let lineValue = Value ? Value : 0;
                                            let deff = lineValue - MinValue
                                            let FinalValue = deff > 0 ? (deff / Value) * 100 : 0;
                                            aitem["Supplier" + idx] = FinalValue > 0 ? FinalValue.toFixed(2) + "%" : "0.00%";
                                        }
                                    });
                                } else if (Totals === "Item Participation %") {
                                    item.itemresponse.forEach((itemresponse, Index) => {
                                        var Property = 'Supplier' + Index;
                                        if (!aitem.hasOwnProperty(Property)) {
                                            aitem["Supplier" + Index] = "100.00%";
                                        }
                                    });
                                }
                            });
                        }
                    });
                    oData.push(aitem);
                });
            },
            ExportToExcel: function () {
                var JSONData = this.getView().getModel().getData().data;
                JSONData.forEach((JSONData) => {
                    delete JSONData.Currency;
                    delete JSONData.itemresponse;
                });
                const ReportTitle = "Bid Comparision Report";
                const ShowLabel = true;
                var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
                var CSV = '';
                //Set Report title in first row or line
                CSV += ReportTitle + '\r\n\n';

                //This condition will generate the Label/Header
                if (ShowLabel) {
                    var row = "";
                  const key = 'field';
                 const arrayColumnsByKey = [...new Map(this.initialComlumns.map(item => [item[key], item])).values()];
                 let columnData = arrayColumnsByKey;
                 columnData.forEach((item) => {
                    row += item.field + ',';
                });
                    // for (var index in columnData) {
                    //     //Now convert each value to string and comma-seprated
                    //     row += index + ',';
                    // }
                    row = row.slice(0, -1);
                    //append Label row with line break
                    CSV += row + '\r\n';
                }
                //1st loop is to extract each row
                for (var i = 0; i < arrData.length; i++) {
                    var row = "";
                    //2nd loop will extract each column and convert it in string comma-seprated
                    for (var index in arrData[i]) {
                        row += '"' + arrData[i][index] + '",';
                    }
                    row.slice(0, row.length - 1);
                    //add a line break after each row
                    CSV += row + '\r\n';
                }
                if (CSV == '') {
                    alert("Invalid data");
                    return;
                }

                //Generate a file name
                var fileName = "";
                //this will remove the blank-spaces from the title and replace it with an underscore
                fileName += ReportTitle.replace(/ /g, "_");
                //Initialize file format you want csv or xls
                var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
                var link = document.createElement("a");
                link.href = uri;
                //set the visibility hidden so it will not effect on your web-layout
                link.style = "visibility:hidden";
                link.download = fileName + ".csv";
                //this part will append the anchor tag and remove it after automatic click
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
        });
    });
