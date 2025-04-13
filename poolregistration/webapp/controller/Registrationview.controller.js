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
        var tempFolderObjId,
            token;

        return Controller.extend("poolregistration.controller.Registrationview", {
            onInit: function () {
                var oThisController = this;
                var oDeviceModel = new JSONModel(Device);
                oDeviceModel.setDefaultBindingMode("OneWay");
                this.getView().setModel(oDeviceModel, "device");
                this.prepareLocalModel();
                this.preparePostModel();
                // this.checkFolderExist("CarPooling");

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
            prepareLocalModel: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var localModel = {
                    Post_IT_ID: "",
                    saveEnabled: true,
                    updateEnabled: false,
                    deleteEnabled:false,
                    editEnabled: true,
                    appModulePath: appModulePath,
                    imageSource: appModulePath + "/model/ImageNotAvailable.png",
                    toolbarIcon: appModulePath + "/model/carpooling.png",
                    ImageName:""
                }
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(localModel);
                this.getView().setModel(oModel, "LocalModel");
            },
            preparePostModel: function () {
                var EmailId = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                var oModelData = {
                    PoolID: Math.floor(Math.random() * 90000) + 10000,
                    Date: new Date(),
                    Post_IT_ID: "",
                    Rate_Per_Person: "",
                    From_Location: "",
                    To_Location: "",
                    Start_Time: "",
                    End_Time: "00:00:00",
                    Pickup_Point: "",
                    Avail_Seats: "",
                    isAC: false,
                    Email: EmailId,
                    Extn: "",
                    Telephone: "",
                    Mobile_Num: "",
                    Remarks: "",
                    Desc: "",
                    Code: "",
                    StatuDesc: "",
                    StatuCode: "A"
                };
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oModelData);
                this.getView().setModel(oModel);
                this.HeaderData = $.extend({}, oModelData);
                this.getView().bindElement("/");
                let oFileUploader = this.getView().byId("fileUploader");
                let docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                let sUploadURL = docuServiceBaseUrl + "/CarPooling/" + oModelData.PoolID + "/";
                oFileUploader.setUploadUrl(sUploadURL);
            },
            getPoolingData: function (evnt) {
                var that = this;
                let PostITID = this.getView().byId("_postId").getValue();
                if (PostITID) {
                    sap.ui.core.BusyIndicator.show(0);
                    let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    let appPath = appId.replaceAll(".", "/");
                    var appModulePath = jQuery.sap.getModulePath(appPath);
                    var sUrl = appModulePath + "/service/car_pool_entity?$filter=Post_IT_ID eq '" + PostITID + "'";
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
                            var oModel = new sap.ui.model.json.JSONModel();
                            // let sUploadURL = that.getView().byId("fileUploader").getUploadUrl();
                            if (Data.length > 0) {
                                if(Data[0].StatuCode === "D"){
                                    MessageBox.error("Record Not Available");
                                    that.prepareLocalModel();
                                    that.preparePostModel();
                                    sap.ui.core.BusyIndicator.hide();
                                    return;                                    
                                }
                                oModel.setData(Data[0]);
                                that.getView().setModel(oModel);
                                var docuServiceBaseUrl = that._getDocServiceRuntimeBaseURL();
                                var sUploadURL = docuServiceBaseUrl + "/CarPooling/" + Data[0].PoolID + "/";
                                var oFileUploader = that.getView().byId("fileUploader");
                                oFileUploader.setUploadUrl(sUploadURL);
                                that.loadAttachments(sUploadURL);
                                that.getView().getModel("LocalModel").setProperty("/saveEnabled", false);
                                that.getView().getModel("LocalModel").setProperty("/updateEnabled", true);
                                that.getView().getModel("LocalModel").setProperty("/deleteEnabled", true);
                                 if (Data[0].StatuCode === "C") {
                                    that.getView().getModel("LocalModel").setProperty("/deleteEnabled", false);
                                    that.getView().getModel("LocalModel").setProperty("/editEnabled", false);
                                }
                            } else {
                                MessageBox.error("Record Not Available");
                                that.prepareLocalModel();
                                that.preparePostModel();
                            }
                            sap.ui.core.BusyIndicator.hide();
                        },
                        error: function (request, status, error) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageBox.error("Technical error please contact system administrator.");
                        }
                    });
                } else {
                    MessageBox.error("Please enter Post-IT ID to get the details.");
                    that.getView().getModel("LocalModel").setProperty("/saveEnabled", true);
                    that.getView().getModel("LocalModel").setProperty("/updateEnabled", false);
                    that.getView().getModel("LocalModel").setProperty("/deleteEnabled", false);
                }
            },
            onReset: function (oEvent) {
                var that = this;
                MessageBox.warning("Do you really want to reset the entry ?", {
                    actions: ["Yes", MessageBox.Action.CANCEL],
                    emphasizedAction: "Yes",
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            that.prepareLocalModel();
                            that.preparePostModel();
                        }
                    }
                });
            },
            onSubmitRecord: function () {
                var MessageModel = this.validateDialogRecord();
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
            validateDialogRecord: function () {
                var poolData = this.getView().getModel().getData();
                var MessageModel = [];
                if (!poolData.From_Location || poolData.To_Location === "(Select)") {
                    MessageModel.push("Please select From Location");
                    this.getView().byId("_fromLoc").setValueState("Error");
                } else {
                    this.getView().byId("_fromLoc").setValueState("None");
                }
                if (!poolData.To_Location || poolData.To_Location === "(Select)") {
                    MessageModel.push("Please select To Location");
                    this.getView().byId("_toLoc").setValueState("Error");
                } else {
                    this.getView().byId("_toLoc").setValueState("None");
                }
                if (!poolData.Rate_Per_Person) {
                    MessageModel.push("Please enter Rate");
                    this.getView().byId("_ratePerPerson").setValueState("Error");
                } else {
                    this.getView().byId("_ratePerPerson").setValueState("None");
                }
                if (!poolData.Start_Time) {
                    MessageModel.push("Please enter Start Time");
                    this.getView().byId("_startTime").setValueState("Error");
                } else {
                    this.getView().byId("_startTime").setValueState("None");
                }
                if (!poolData.Pickup_Point) {
                    MessageModel.push("Please enter Pick Up Point");
                    this.getView().byId("_pickUpPoint").setValueState("Error");
                } else {
                    this.getView().byId("_pickUpPoint").setValueState("None");
                }
                if (!poolData.Avail_Seats) {
                    MessageModel.push("Please enter Available Seats");
                    this.getView().byId("_availSeats").setValueState("Error");
                } else {
                    this.getView().byId("_availSeats").setValueState("None");
                }
                if (!poolData.Mobile_Num) {
                    MessageModel.push("Please enter Mobile Number");
                    this.getView().byId("_mobNum").setValueState("Error");
                 } else{
                    this.getView().byId("_mobNum").setValueState("None");
                    
                 }
                return MessageModel;
            },
            postData: function () {
                var that = this;
                sap.ui.core.BusyIndicator.show(0);
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var aData = this.getView().getModel().getData();
                let dummyempid = Math.floor(Math.random() * 90000) + 10000;
                let dummypostno = Math.floor(Math.random() * 900) + 100;
                aData.StatuDesc = "Pending for Approval",
                aData.StatuCode = "B"
                aData.imagePath = that.getView().getModel("LocalModel").getProperty("/ImageName");
                aData.Post_IT_ID = "CAR/" + dummyempid + "/" + dummypostno;
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var EmailId = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                aData.Code = EmailId;
                aData.Desc = tempFolderObjId;
                this.HeaderData = aData;
                var getURL = appModulePath + "/service/car_pool_entity?$filter=Code eq '"+EmailId+"'";
                var sURL = appModulePath + "/service/car_pool_entity"
                $.ajax({
                    url: getURL,
                    method: "GET",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "X-CSRF-Token": "Fetch",
                        "Content-Type": "application/json"
                    },
                    success: function (result1, xhr1, headers1) {
                        var fetchedToken = headers1.getResponseHeader("X-CSRF-Token");
                        // var notRejItem = true;
                        // for(var i = 0; i < result1.value.length ; i++){
                        //     if(result1.value[i].StatuCode === "D"){
                        //         notRejItem = false;
                        //     }
                        // }
                        // if(notRejItem){
                        //     MessageBox.error("One active registration request available for this user");
                        //     sap.ui.core.BusyIndicator.hide();
                        // } else {
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
                                var PostIT_ID = Data.Post_IT_ID;
                                that.getView().getModel("LocalModel").setProperty("/Post_IT_ID", PostIT_ID);
                                sap.ui.core.BusyIndicator.hide();
                                MessageBox.success("Record Inserted Successfully", {
                                    actions: [MessageBox.Action.OK],
                                    emphasizedAction: MessageBox.Action.OK,
                                    onClose: function (sAction) {
                                        that.startWorkflowInstance();
                                        that.getPoolingData();
                                    }
                                });
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
                        // debugger;

                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured, Please check chrome inspector tool for error details"
                        );

                    }
                    
                });
            
            },
            onSwitchChange: function (oEvent) {
                var State = oEvent.getParameters().state;
                this.getView().getModel().setProperty("/isAC", State);
            },
            _fetchToken: function () {
                var fetchedToken;
                sap.ui.core.BusyIndicator.show(0);
                jQuery.ajax({
                  url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
                  method: "GET",
                  async: false,
                  headers: {
                    "X-CSRF-Token": "Fetch",
                  },
                  success(result, xhr, data) {
                    fetchedToken = data.getResponseHeader("X-CSRF-Token");
                  },
                });
                return fetchedToken;
              },
      
              _getWorkflowRuntimeBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
      
                return appModulePath + "/bpmworkflowruntime/v1";
              },
            startWorkflowInstance: function (fetchedToken) {
                var definitionId = "ns.carpoolwf";
                var that = this;
                var LocalModel = that.getView().getModel("LocalModel").getProperty("/");
                var context = {
                    Inboxurl: window.location.origin + "/site/carpooling?sap-language=en#WorkflowTask-DisplayMyInbox",
                    PoolData: that.HeaderData,
                    Requester: {
                        Email: that.HeaderData.Code,                       
                        Name : sap.ushell.Container.getService("UserInfo").getUser().getFullName()
                    },
                    Approver: {
                        Name : "Carla Grant"
                    }
                };
                context.PoolData.Remarks = "";
                var data = {
                    definitionId: definitionId,
                    context: context
                };
                $.ajax({
                    url: this._getWorkflowRuntimeBaseURL() + "/workflow-instances",
                    method: "POST",
                    async: false,
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-Token": this._fetchToken(),
                    },
                    data: JSON.stringify(data),
                    success: function (result, xhr, data) {
                        MessageToast.show("Workflow Triggered succesfully", {
                            duration: 6000
                        });
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (request, status, error) {
                        sap.ui.core.BusyIndicator.hide();
                        var response = JSON.parse(request.responseText);
                        MessageBox.error("Technical error please contact system administrator");
                    }
                });
            },

            // myDateFormatter: function (dValue) {
            //     if (dValue) {
            //         const date1 = dValue.substring(6, 8);
            //         const month1 = dValue.substring(4, 6)
            //         const year = dValue.substring(0, 4)
            //         const dateStr = date1 + "/" + month1 + "/" + year;
            //         return dateStr;
            //     }
            //     else {
            //         return null;
            //     }
            // },

            updatePoolData: function (oevent,multi) {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                var Data = this.getView().getModel().getData();
                Data.imagePath = that.getView().getModel("LocalModel").getProperty("/ImageName");
                if(tempFolderObjId){
                    Data.Desc = tempFolderObjId;                    
                }
              
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
                        // that.getItemsData("");
                        sap.ui.core.BusyIndicator.hide();
                        if(!multi){
                        MessageBox.success("Record Updated Successfully");
                        } 
                    },
                    error: function (result1, xhr1, headers1) {
                        
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured while updating the Status, Please check chrome inspector tool for error details"
                        );
                    }
                });
            },
            _getDocServiceRuntimeBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath + "/docservice";
            },

            onDeleteRecord: function (ID) {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                var Data = this.getView().getModel().getData();
                var appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath");
                var sURL = appModulePath + "/service/car_pool_entity(ID=" + Data.ID + ")"
                $.ajax({
                    url: sURL,
                    method: "DELETE",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result1, xhr1, headers1) {
                        MessageToast.show("Request deleted successfully");
                        that.prepareLocalModel();
                         that.preparePostModel();
                        var LocalModel = that.getView().getModel("LocalModel");
                        LocalModel.setProperty("/imageSource", appModulePath + "/model/ImageNotAvailable.png");

                    },
                    error: function (result1, xhr1, headers1) {
                        MessageToast.show(
                            "Error occured while updating the Status, Please check chrome inspector tool for error details"
                        );
                    }
                });
            },
            onDelete: function (oEvent) {
                var that = this;
               
                MessageBox.warning("Are you sure you want to delete this record?.", {
                    actions: ["Yes", "No"],
                    emphasizedAction: "Yes",
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            sap.ui.core.BusyIndicator.show();
                            that.onDeleteRecord();
                            var docuServiceBaseUrl = that._getDocServiceRuntimeBaseURL();
                            var sUrl = docuServiceBaseUrl + "/CarPooling/?succinct=true";
                            var PoolID = that.getView().getModel().getProperty("/PoolID").toString()
                            var oSettings = {
                                "url": sUrl,
                                "method": "GET",
                            };
                            $.ajax(oSettings)
                                .done(function (results) {
                                    var aObjects = results.objects;
                                    var tempFObjId = "";
                                    if (aObjects.length > 0) {
                                        for (var i = 0; i < aObjects.length; i++) {
                                         if (aObjects[i].object.succinctProperties["cmis:name"] === PoolID) {
                                            tempFObjId = aObjects[i].object.succinctProperties["cmis:objectId"];
                                                that.deleteDocFolder(tempFObjId);
                                            }
                                        }
                                        sap.ui.core.BusyIndicator.hide();
                                    } else {
                                        sap.ui.core.BusyIndicator.hide();
                                    }
                                })
                                .fail(function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                });
                        }
                    }
                });
            },
            // onDelete: function (oEvent) {

            deleteDocFolder: function (tempFObjId) {
                console.log("deleting temporary folder with a objId '" + tempFObjId + "'");
                var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                var sUrl = docuServiceBaseUrl + "/CarPooling/";
                var oThisController = this;
                var oFormData = new window.FormData();
                oFormData.append("cmisAction", "deleteTree");
                oFormData.append("objectId", tempFObjId);
                var oSettings = {
                    "url": sUrl,
                    "method": "POST",
                    "async": false,
                    "data": oFormData,
                    "cache": false,
                    "contentType": false,
                    "processData": false,
                    "headers": {
                        'X-CSRF-Token': token
                    }
                };

                $.ajax(oSettings)
                    .done(function (results) {
                        sap.ui.core.BusyIndicator.hide();
                    })
                    .fail(function (err) {
                        sap.ui.core.BusyIndicator.hide();
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    });
            },
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },
            getContentDensityClass: function () {
                var oThisController = this;
                oThisController.getView().addStyleClass(oThisController.getOwnerComponent().getContentDensityClass());
            },
            _BusyDialog: new BusyDialog({
                busyIndicatorDelay: 0
            }),
            openBusyDialog: function () {
                if (this._BusyDialog) {
                    this._BusyDialog.open();
                } else {
                    this._BusyDialog = new BusyDialog({
                        busyIndicatorDelay: 0
                    });
                    this._BusyDialog.open();
                }
            },
            closeBusyDialog: function () {
                if (this._BusyDialog) {
                    this._BusyDialog.close();
                }
            },
            checkFolderExist: function (folderName) {
                var responseStatusCode;
                var that = this;
                var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                // if (folderName == "ManageContract") {
                var sUrl = "";
                if (folderName === "CarPooling") {
                    sUrl = docuServiceBaseUrl + "/CarPooling/";
                } else {
                    sUrl = docuServiceBaseUrl + "/CarPooling/" + folderName;
                }
                var oSettings = {
                    "url": sUrl,
                    "method": "GET",
                    "async": false,
                    "headers": {
                        "ContentType": 'application/json',
                        "Accept": 'application/json',
                        "cache": false,
                        'X-CSRF-Token': 'Fetch'
                    }
                };
                var oThisController = this;
                $.ajax(oSettings)
                    .done(function (results, textStatus, request) {
                        // var aObjects = results.objects;
                        // var tempFObjId = results.succinctProperties["cmis:objectId"];
                        // if (aObjects.length > 0) {
                        //     var tempFObjId = results.succinctProperties["cmis:objectId"];
                        //     that.deleteDocFolder(tempFObjId);
                        // }
                        token = request.getResponseHeader('X-Csrf-Token');
                    })
                    .fail(function (err) {
                        token = err.getResponseHeader('X-Csrf-Token');
                        responseStatusCode = err.status;
                        if (responseStatusCode != 404) {
                            if (err !== undefined) {
                                var oErrorResponse = $.parseJSON(err.responseText);
                                MessageToast.show(oErrorResponse.message, {
                                    duration: 6000
                                });
                            } else {
                                MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                            }
                        }
                    });
                if (folderName == "CarPooling") {
                    if (responseStatusCode == 404) {
                        this.createFolder(folderName);
                    } else if (responseStatusCode == 200) {
                        console.log("folder with a name 'CarPooling' already exisits");
                    } else {
                        console.log("something is wrong");
                    }
                } else {
                    if (responseStatusCode == 404) {
                        // responseStatusCode = request.status;
                        this.createFolder(folderName);
                    } else if (responseStatusCode == 200) {
                        console.log("folder with a name " + folderName + " already exisits");
                    } else {
                        console.log("something is wrong");
                    }
                }

            },
            createFolder: function (folderName) {
                var oThisController = this;
                var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                var sUrl = "";
                if (folderName == "CarPooling") {
                    console.log("creating a folder 'root/CarPooling'");
                    sUrl = docuServiceBaseUrl + "/";
                } else {
                    sUrl = docuServiceBaseUrl + "/CarPooling/";
                }
                var oFormData = new window.FormData();
                oFormData.append("cmisAction", "createFolder");
                oFormData.append("succinct", "true");
                oFormData.append("propertyId[0]", "cmis:name");
                oFormData.append("propertyValue[0]", folderName);
                oFormData.append("propertyId[1]", "cmis:objectTypeId");
                oFormData.append("propertyValue[1]", "cmis:folder");
                var oSettings = {
                    "url": sUrl,
                    "method": "POST",
                    "async": false,
                    "data": oFormData,
                    "cache": false,
                    "contentType": false,
                    "processData": false,
                    "headers": {
                        'X-CSRF-Token': token
                    }
                };

                $.ajax(oSettings)
                    .done(function (results) {
                        tempFolderObjId = results.succinctProperties["cmis:objectId"];
                    })
                    .fail(function (err) {
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    });
            },



            handleUploadComplete: function (oEvent) {
                var that = this;
                var sResponse = oEvent.getParameter("response"),
                    sMessage;
               if (!sResponse) {
                    sMessage = "Image inserted successfully";
                    MessageToast.show(sMessage, {
                        duration: 6000
                    });
                    if(that.getView().getModel("LocalModel").getProperty("/updateEnabled")){
                         that.updatePoolData("","Multiple");                   
                      }
                    this.loadAttachments(that.getView().byId("fileUploader").getUploadUrl());
                }
            },
            loadAttachments: function (sUrl) {
                var that = this;
                console.log("Upload URL: " + sUrl);
                var sUrl = sUrl + "?succinct=true";
                var oSettings = {
                    "url": sUrl,
                    "method": "GET",
                };
                var oThisController = this;
                $.ajax(oSettings)
                    .done(function (results) {
                        var LocalModel = that.getView().getModel("LocalModel");
                        var aObjects = results.objects;
                        aObjects.sort(function (a, b) {
                            var c = new Date(a.object.succinctProperties["cmis:creationDate"]);
                            var d = new Date(b.object.succinctProperties["cmis:creationDate"]);
                            return c - d;
                        });
                        if (aObjects.length > 0) {
                            var uploadurl = that.getView().byId("fileUploader").getUploadUrl();
                            var imageId = aObjects[aObjects.length-1].object.succinctProperties["cmis:objectId"];
                            LocalModel.setProperty("/imageSource", uploadurl + "?objectId=" + imageId);
                            LocalModel.setProperty("/ImageName", "/"+uploadurl.split("~/")[1]+ "?objectId=" + imageId);
                        } else {
                            LocalModel.setProperty("/ImageName", "/model/ImageNotAvailable.png");
                            LocalModel.setProperty("/imageSource", LocalModel.getProperty("/appModulePath") + "/model/ImageNotAvailable.png");
                        }
                    })
                    .fail(function (err) {
                      if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            // MessageToast.show(oErrorResponse.message, {
                            //     duration: 6000
                            // });
                        } else {
                            // MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    });
            },

            handleUploadPress: function () {
                var oFileUploader = this.getView().byId("fileUploader");
                var FolderName = this.getView().getModel().getProperty("/PoolID");
                var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                var sUploadURL = docuServiceBaseUrl + "/CarPooling/" + FolderName + "/";
                oFileUploader.setUploadUrl(sUploadURL);
                oFileUploader.setSendXHR(true);
                var headerParma = new sap.ui.unified.FileUploaderParameter();
                headerParma.setName('x-csrf-token');
                headerParma.setValue(token);
                oFileUploader.insertHeaderParameter(headerParma);
                oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({ name: "slug", value: oFileUploader.getValue() }));

                if (!oFileUploader.getValue()) {
                    MessageToast.show("Choose a file first");
                    return;
                }
                oFileUploader.checkFileReadable().then(function () {
                    oFileUploader.upload();
                    oFileUploader.destroyHeaderParameters();
                    oFileUploader.destroyParameters();
                }, function (error) {
                    MessageToast.show("The file cannot be read. It may have changed.");
                }).then(function () {
                    oFileUploader.clear();
                });

            },

            handleTypeMissmatch: function (oEvent) {
                var aFileTypes = oEvent.getSource().getFileType();
                aFileTypes.map(function (sType) {
                    return "*." + sType;
                });
                MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
                    " is not supported. Choose one of the following types: " +
                    aFileTypes.join(", "));
            },

            handleValueChange: function (oEvent) {
                var oUploadCollection = oEvent.getSource();
                var FolderName = this.getView().getModel().getProperty("/PoolID");
                this.checkFolderExist(FolderName)
                var cmisActionHiddenFormParam = new FileUploaderParameter({
                    name: "cmisAction",
                    value: "createDocument"
                });
                oUploadCollection.addParameter(cmisActionHiddenFormParam);
                var cmisActionHiddenFormParam0 = new FileUploaderParameter({
                    name: "succinct",
                    value: "true"
                });
                oUploadCollection.addParameter(cmisActionHiddenFormParam0);

                var objectTypeIdHiddenFormParam1 = new FileUploaderParameter({
                    name: "propertyId[0]",
                    value: "cmis:objectTypeId"
                });
                oUploadCollection.addParameter(objectTypeIdHiddenFormParam1);

                var propertyValueHiddenFormParam1 = new FileUploaderParameter({
                    name: "propertyValue[0]",
                    value: "cmis:document"
                });
                oUploadCollection.addParameter(propertyValueHiddenFormParam1);

                var objectTypeIdHiddenFormParam2 = new FileUploaderParameter({
                    name: "propertyId[1]",
                    value: "cmis:name"
                });
                oUploadCollection.addParameter(objectTypeIdHiddenFormParam2);

                var propertyValueHiddenFormParam2 = new FileUploaderParameter({
                    name: "propertyValue[1]",
                    value: oEvent.getParameter("files")[0].name
                });
                oUploadCollection.addParameter(propertyValueHiddenFormParam2);
            },
        });
    });
