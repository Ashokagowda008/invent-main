sap.ui.define(["sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/commons/FileUploaderParameter",
    "sap/m/UploadCollectionParameter",
    "sap/m/BusyDialog", "sap/ui/core/format/DateFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, UIComponent, Log, JSONModel, Device, MessageBox, Fragment, FileUploaderParameter, UploadCollectionParameter, BusyDialog, DateFormat) {
        "use strict";

        return Controller.extend("carpoolbooking.controller.booking", {
            onInit: function () {
                var oThisController = this;
                var oDeviceModel = new JSONModel(Device);
                oDeviceModel.setDefaultBindingMode("OneWay");
                this.getView().setModel(oDeviceModel, "device");
                var oFilter = this.getView().byId("filterBar");
                oFilter.addEventDelegate({
                    "onAfterRendering": function (oEvent) {
                        var oButton = oEvent.srcControl._oSearchButton;
                        // oButton.setText("Submit");
                        oButton.setType("Accept");
                        var clearButton = oEvent.srcControl._oClearButtonOnFB;
                        // clearButton.setText("Reset");
                        clearButton.setType("Reject");
                    }
                });
                this.prepareLocalModel();
                this.preparePostModel();
                this.PostData ="";


            },
            onMenuAction: function (oEvent) {
                var oItem = oEvent.getParameter("item"),
                    sItemPath = "";

                while (oItem instanceof sap.m.MenuItem) {
                    sItemPath = oItem.getText() + " > " + sItemPath;
                    oItem = oItem.getParent();
                }
            },
            onClear: function (oEvent) {
                this.getView().byId("_fromLoc").setSelectedKey("(Select)");
                this.getView().byId("_toLoc").setSelectedKey("(Select)");
                this.getView().byId("_startTime").setValue("");
                this.getView().byId("_returnime").setValue("");
                this.getView().byId("_isAc").setText("No");
                this.getView().getModel().setData([]);
                this.PostData ="";
            },
            onSearch: function (oEvent) {
                var fromloc = this.getView().byId("_fromLoc").getSelectedKey() === "(Select)" ? "" : this.getView().byId("_fromLoc").getSelectedKey();
                var toloc = this.getView().byId("_toLoc").getSelectedKey() === "(Select)" ? "" : this.getView().byId("_toLoc").getSelectedKey();
                var Start_Time = this.getView().byId("_startTime").getValue();
                var Return_Time = this.getView().byId("_returnime").getValue();
                var comFil = "StatuCode eq 'C'";
                if (fromloc) {
                    comFil = comFil === "" ? "From_Location eq '" + fromloc + "'" : comFil + " and From_Location eq '" + fromloc + "'";
                }
                if (toloc) {
                    comFil = comFil === "" ? "To_Location eq '" + toloc + "'" : comFil + " and To_Location eq '" + toloc + "'";
                }
                sap.ui.core.BusyIndicator.show(0);
                this.getItemsData(comFil);
            },

            getItemsData: function (aFilters) {
                var that = this;
                this.PostData ="";
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var sUrl = appModulePath + "/service/car_pool_entity?$filter=StatuCode eq 'C'";
                if (aFilters) {
                    sUrl = appModulePath + "/service/car_pool_entity?$filter=" + aFilters;
                }
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
                        var isAc = that.getView().byId("_isAc").getText()=== "No" ? false : true;
                        var finalData = [];
                        for (var i = 0; i < Data.length; i++) {
                            if(Data[i].isAC === isAc){
                                Data[i].isAC = Data[i].isAC === true ? "Yes" : "No";
                                finalData.push(Data[i]); 
                            }
                            
                        }
                        that.getView().getModel().setData(finalData);
                        sap.ui.core.BusyIndicator.hide();

                    },
                    error: function (request, status, error) {
                        that.getView().getModel().setData([]);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Technical error please contact system administrator");
                    }
                });

            },
            dateFormatter: function (val) {
                if (val) {
                    jQuery.sap.require("sap.ui.core.format.DateFormat");
                    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        source: {
                            pattern: "dd/MM/yyyy"
                        },
                        pattern: "dd/MM/yyyy"
                    });
                    return oDateFormat.format(new Date(val));
                }
                else {
                    return null;
                }
            },
            imagePathFormatter: function (val) {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                if (val) {
                    return appModulePath + val;
                }
                else {
                    return appModulePath + "/model/ImageNotAvailable.png";
                }
            },
            prepareLocalModel: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var localModel = {
                    requestsCount: 0,
                    appModulePath: appModulePath,
                    toolbarIcon: appModulePath + "/model/Booking.jpg",
                    From_Location: "",
                    To_Location: "",
                    Depart_Time: "",
                    Return_Time: "",
                    isAC: "No",
                    BookingDate: new Date()
                }
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(localModel);
                this.getView().setModel(oModel, "LocalModel");
            },
            preparePostModel: function () {
                // var EmailId = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                var oModelData = [];
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oModelData);
                this.getView().setModel(oModel);
                // this.HeaderData = $.extend({}, oModelData);
            },
            onSubmitRecord: function () {
                var MessageModel = this.validateRecord();
                if (MessageModel.length === 0) {
                    this.postData();
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
            validateRecord: function () {
                var poolData = this.PostData;
                var MessageModel = [];
                if (!poolData) {
                    MessageModel.push("Please select record to submit.");
                } 
                return MessageModel;
            },
            onSelectionChange: function (oEvent) {
                var bSelected = oEvent.getParameter("selected");
                this.PostData = "";
                this.PostData = oEvent.getParameter("listItem").getBindingContext().getObject();
             },
             postData: function(){
                var that = this;
                sap.ui.core.BusyIndicator.show(0);
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var PoolData = this.PostData;
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var sURL = appModulePath + "/service/Booking_entity"
                var aData ={
                    PoolGUID:PoolData.ID,
                    PoolID:PoolData.PoolID,
                    Post_IT_ID:PoolData.Post_IT_ID,
                    From_Location:PoolData.From_Location,
                    To_Location:PoolData.To_Location,
                    BookingDate:new Date(),
                    Depart_Time: this.getView().byId("_startTime").getValue() === "" ? "00:00:00" : this.getView().byId("_startTime").getValue(),
                    Return_Time:this.getView().byId("_returnime").getValue() === "" ? "00:00:00" : this.getView().byId("_returnime").getValue(),   
                    StatuDesc:"Booked",
                    StatuCode:"A"
                }
                $.ajax({
                    url: sURL,
                    method: "GET",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "X-CSRF-Token": "Fetch",
                        "Content-Type": "application/json"
                    },
                    success: function (result1, xhr1, headers1) {
                        var fetchedToken = headers1.getResponseHeader("X-CSRF-Token");
                        $.ajax({
                            url: sURL,
                            method: "POST",
                            async: true,
                            headers: {
                                "X-CSRF-Token": fetchedToken,
                                'Accept': 'application/json',
                                "Content-Type": "application/json"
                            },
                            data: JSON.stringify(aData),
                            success: function (result1, xhr1, headers1) {
                                var Data = result1;
                                sap.ui.core.BusyIndicator.hide();
                                MessageBox.success("Your Car Pool booking successfull.");
                                that.updatePoolData();
                                
                           },
                            error: function (result1, xhr1, headers1) {
                                sap.ui.core.BusyIndicator.hide();
                                MessageToast.show(
                                    "Error occured, Please check chrome inspector tool for error details"
                                );
                            }
                        });
                    //    }
                    },
                    error: function (result1, xhr1, headers1) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured, Please check chrome inspector tool for error details"
                        );

                    }
                    
                });
            
            },
           
            updatePoolData: function () {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                var Data = this.PostData;
                Data.StatuDesc="Booked";
                Data.StatuCode="E";
                Data.isAC= Data.isAC === "NO" ? false :true;
                delete Data.createdAt;
                delete Data.createdBy;
                delete Data.modifiedAt;
                delete Data.modifiedBy;
                var appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath");
                var sURL = appModulePath + "/service/car_pool_entity(ID=" + Data.ID + ")";
                $.ajax({
                    url: sURL,
                    method: "PUT",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(Data),
                    success: function (result1, xhr1, headers1) {
                       sap.ui.core.BusyIndicator.hide();
                       that.PostData="";
                       that.getItemsData("");
                   },
                    error: function (result1, xhr1, headers1) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured while updating the Status, Please check chrome inspector tool for error details"
                        );
                    }
                });
            },
        });
    });
