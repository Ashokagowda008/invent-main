sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Fragment, MessageToast, History) {
        "use strict";

        return Controller.extend("successorlist.controller.manageweightage", {
            onInit() {
                this.getOwnerComponent().getRouter().getRoute("RouteWeightagelist").attachPatternMatched(this._onMatched, this);
            },
            _onMatched: function (oEvent) {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                // @ts-ignore
                this.appModulePath = jQuery.sap.getModulePath(appPath);
                this.prepareLocalModel();
                // sap.ui.core.BusyIndicator.show(0);
                this.getWeightageInfo();
                // this.getOwnerComponent().getModel().metadataLoaded().then(this._bindData.bind(this, oArgs.id));
            },
            prepareLocalModel: function () {
                var localModel = {
                    weightages: [{ key: "age", Text: "Age" }, { key: "promotion", Text: "Promotion" }, { key: "education", Text: "Education" }, { key: "rating", Text: "Rating" }, { key: "location", Text: "Location" },]
                }
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(localModel);
                this.getView().setModel(oModel, "LocalModel");
            },
            onBack: function () {
                var sPreviousHash = History.getInstance().getPreviousHash();
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.getOwnerComponent().getRouter().navTo("Routesuccessorview", null, true);
                }
            },
            onClickOfNewWeightage: function (oEvent) {
                let WeightageData = this.getView().getModel("WeightageModel").getData();
                WeightageData.push({
                    weightageType: "",
                    weightage: 0,
                    enabled: true,
                    Nameenabled: true
                });

                this.getView().getModel("WeightageModel").setData(WeightageData);
                //   this.getView().byid("idProductsTable").refresh();

            },
            onPressSave: function (oEvent) {
                var that = this;
                let dataSet = this.getView().getModel("WeightageModel").getData();
                let MessageModel = this.validateRecords(dataSet);
                if (MessageModel.length === 0) {
                    that.UpdateData(dataSet);
                } else {
                    var messages = MessageModel[0];
                    MessageModel.forEach(function (value, index, items) {
                        if (index !== 0) {
                            messages = messages + "\n" + value;
                        }
                    })
                    MessageBox.error(messages);
                }
            },
            onPressEdit: function (oEvent) {
                let dataObj = oEvent.getSource().getBindingContext("WeightageModel").getObject();
                let LineItemPath = oEvent.getSource().getBindingContext("WeightageModel").getPath().split("/");
                dataObj.enabled = true;
                dataObj.Nameenabled = false;
                let tableData = this.getView().getModel("WeightageModel").getData();
                tableData.splice(parseInt(LineItemPath[1]), 1, dataObj);
                this.getView().getModel("WeightageModel").setData(tableData);
            },

            validateRecords: function (dataSet) {
                var that = this;
                let messageData = [];
                let totalweightage = 0;
                let duplicates = dataSet.filter((record, index) => {
                    let { weightageType } = record;
                    return index !== dataSet.findIndex(record => record.weightageType === weightageType);
                  });
                  if (duplicates.length > 0) {
                    messageData.push("Name cannot be same for multiple line items");
                  } 
                for (var i = 0; i < dataSet.length; i++) {
                    if (!dataSet[i].weightageType) {
                        messageData.push("Name cannot be empty in Line" + i + 1 + ".");
                    }
                    if (!dataSet[i].weightage || dataSet[i].weightage == 0) {
                        messageData.push("Weightage value cannot be zero or empty in Line" + i + 1 + ".");
                    }
                    if (dataSet[i].weightage) {
                        totalweightage = totalweightage + parseFloat(dataSet[i].weightage);
                    }
                }
                if (totalweightage > 100) {
                    messageData.push("Total Weightage value of Weightage List shouldn't be greater than 100.");
                }
                else if (totalweightage < 100) {
                    messageData.push("Total Weightage value of Weightage List shouldn't be lesser than 100.");
                }
                 
                return messageData;
            },
            UpdateData: function (dataSet) {
                let that = this;
                let TotalCount = 0;
                for(var a=0; a < dataSet.length; a++){
                if (!dataSet[a].hasOwnProperty('id')) {
                    let postData = {};
                    postData.weightageType = dataSet[a].weightageType;
                    postData.weightage = parseFloat(dataSet[a].weightage);
                    var sURL = that.appModulePath + "/odata/v4/service/alweightageservice";
                    $.ajax({
                        url: sURL,
                        type: "POST",
                        async: true,
                        headers: {
                            'Accept': 'application/json',
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify(postData),
                        success: function (result, xhr, data) {
                            TotalCount = TotalCount + 1;
                            if(TotalCount === dataSet.length){
                                MessageBox.success("Weightage posted successfully.");
                                that.getWeightageInfo();
                            }
    
                        }
                    });
    
                } else {
                    let UpdateData = {};
                    UpdateData.weightageType = dataSet[a].weightageType;
                    UpdateData.weightage = parseFloat(dataSet[a].weightage);
                    $.ajax({
                        url: that.appModulePath + "/odata/v4/service/alweightageservice(id=" + dataSet[a].id + ")",
                        method: "PUT",
                        async: false,
                        headers: {
                            'Accept': 'application/json',
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify(UpdateData),
                        success: function (result, xhr, data) {
                            TotalCount = TotalCount + 1;
                            if(TotalCount === dataSet.length){
                                MessageBox.success("Weightage updated successfully.");
                                that.getWeightageInfo();
                            }
                            
                        }
                    });

                }
             }
            },
            
            getWeightageInfo: function () {
                var that = this;
                var sUrl = this.appModulePath + "/odata/v4/service/alweightageservice";
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    async: false,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                        var Data = result.value;
                        Data.forEach(function (mdata) {
                            mdata.enabled = false
                            mdata.Nameenabled = false
                        });
                        var weightageModel = new JSONModel(Data);
                        that.getView().setModel(weightageModel, "WeightageModel");
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (request, status, error) {
                        if (that.getView().getModel("WeightageModel")) {
                            that.getView().getModel("WeightageModel").setData([]);
                        }
                        MessageBox.error("Technical error please contact system administrator");
                    }
                });
            },
            onRemove: function (oEvent) {
                var that = this;
                let dataObj = oEvent.getSource().getBindingContext("WeightageModel").getObject();
                if (dataObj.hasOwnProperty('id')) {
                    $.ajax({
                        url: that.appModulePath + "/odata/v4/service/alweightageservice(id=" + dataObj.id + ")",
                        method: "DELETE",
                        async: false,
                        headers: {
                            'Accept': 'application/json',
                            "Content-Type": "application/json"
                        },
                        success: function (result, xhr, data) {
                            that.getWeightageInfo();
                        },
                        error: function (request, status, error) {
                        }
                    });

                } else {
                    let WeightageData = this.getView().getModel("WeightageModel").getData();
                    let LineItemPath = oEvent.getSource().getBindingContext("WeightageModel").getPath().split("/");
                    WeightageData.splice(parseInt(LineItemPath[1]), 1);
                    that.getView().getModel("WeightageModel").setData(WeightageData);
                }
            }
        });
    });