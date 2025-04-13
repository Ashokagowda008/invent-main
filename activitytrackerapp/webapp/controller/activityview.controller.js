sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    'sap/ui/core/util/Export',
    'sap/ui/core/util/ExportTypeCSV',
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/BusyDialog",
    "sap/m/Dialog",
    "sap/m/Button"

],
    function (Controller, MessageToast, Export, ExportTypeCSV, exportLibrary, Spreadsheet, JSONModel, MessageBox, Fragment, BusyDialog, Dialog, Button) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return Controller.extend("ns.activitytrackerapp.controller.activityview", {
            onInit: function () {
                var oThisController = this;
                this.EmailId = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                this.FullName = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
                this.isAdmin = sap.ushell.Container.getService("UserInfo").getUser().isAdminUser();
                this.prepareLocalModel();

                // this.getView().byId("fCustomer").setFilterFunction(function (sTerm, oItem) {
                //     return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
                // });
                this.MasterID = "";
                this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            prepareLocalModel: function () {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");

                var appModulePath = jQuery.sap.getModulePath(appPath);
                var localModel = {
                    requestsCount: 0,
                    appModulePath: appModulePath,
                    userType: this.isAdmin === true ? "Admin" : "Other",
                    CreatedByUsers: [],
                    filterDate: null
                }
                var oModel = new JSONModel();
                oModel.setData(localModel);
                this.getView().setModel(oModel, "LocalModel");

                this.getTrackersData([]);
                this.getMasterData();
            },
            configureUploadEntity: function (data) {
                var that = this;
                let appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath")
                that.postMasterData(data)
                // $.ajax({
                //     type: "POST", url: appModulePath + "/service/masterdatauploadentity",
                //     async: true,
                //     headers: {
                //         'Accept': 'application/json',
                //         "Content-Type": "application/json"
                //     },
                //     data: JSON.stringify({}),
                //     success: function (result1, xhr1, headers1) {
                //         that.MasterID = result1.ID;
                //         that.postMasterData(data)
                //     }
                // })
            },
            getMasterData: function (aFilters) {
                var that = this;
                var Customers = [], Names = [], ActivityTypes = [], TypeOfWorks = [], ActivityCodes = [];
                let Items = {};
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                let iteration = 1;

                $.ajax({
                    type: "GET", async: false, url: appModulePath + "/service/masterrecordsentity/$count", success: function (result1, xhr1, headers1) {
                        var Count = parseInt(result1);
                        iteration = Math.ceil(Count / 1000);
                    }
                });

                this.skip = 0;
                this.top = 1000;
                this.MasterDataRecords = [];
                var sUrl = "service/masterrecordsentity?$top=" + this.top + "&$skip=" + this.skip + "&$orderby=type desc";
                that.getAllMasterRecordsData(iteration, appModulePath, sUrl);
                let Data = that.MasterDataRecords;  // will update in previous funcn....
                if (Data.length > 0) {
                    Data.forEach(function (item) {
                        if (item.type === "CU") {
                            item.typedesc = "Customer"
                            Customers.push({ type: "CU", code: item.Code, desc: item.Desc });
                        } else if (item.type === "AT") {
                            item.typedesc = "Activity Type"
                            ActivityTypes.push({ type: "AT", code: item.Code, desc: item.Desc });
                        } else if (item.type === "TW") {
                            item.typedesc = "Type Of Work"
                            TypeOfWorks.push({ type: "TW", code: item.Code, desc: item.Desc });
                        } else if (item.type === "AC") {
                            item.typedesc = "Activity Code"
                            ActivityCodes.push({ type: "AC", code: item.Code, desc: item.Desc });
                        }
                    })
                }
                Names.push({ code: "1", desc: that.FullName })
                if (Customers.length > 0) {
                    Customers.unshift({ type: "CU", code: "", desc: "(Select)" });
                }
                if (ActivityTypes.length > 0) {
                    ActivityTypes.unshift({ type: "AT", code: "", desc: "(Select)" });
                }
                if (TypeOfWorks.length > 0) {
                    TypeOfWorks.unshift({ type: "TW", code: "", desc: "(Select)" });
                }
                if (ActivityCodes.length > 0) {
                    ActivityCodes.unshift({ type: "AC", code: "", desc: "(Select)" });
                }
                Items.Names = Names;
                Items.Customers = Customers;
                Items.ActivityTypes = ActivityTypes;
                Items.TypeOfWorks = TypeOfWorks;
                Items.ActivityCodes = ActivityCodes;
                Items.MastersData = Data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(100000);
                oModel.setData(Items);
                that.getView().setModel(oModel, "MasterData");
            },
            getAllMasterRecordsData: function (ite, appModulePath, sUrl) {
                var that = this;
                if (ite > 0) {
                    $.ajax({
                        url: appModulePath + "/" + sUrl,
                        method: "GET",
                        async: false,
                        headers: {
                            'Accept': 'application/json',
                            "Content-Type": "application/json"
                        },
                        success: function (result, xhr, data) {
                            ite--;
                            var Data = result.value;
                            that.MasterDataRecords = [...that.MasterDataRecords, ...Data];

                            that.skip = that.skip + 1000;
                            sUrl = "service/masterrecordsentity?$top=" + that.top + "&$skip=" + that.skip + "&$orderby=type desc"
                            that.getAllMasterRecordsData(ite, appModulePath, sUrl)

                        },
                        error: function (request, status, error) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageBox.error("Technical error please contact system administrator");
                        }
                    });
                }

            },
            getTrackersData: function (aFilters) {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                let EmailId = this.EmailId;
                const appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var sUrl = "";
                if (!this.isAdmin && (aFilters.length === 0)) {
                    sUrl = appModulePath + "/service/activitytrackerentity?$filter=EmailId eq '" + EmailId + "'";
                } else if (this.isAdmin && aFilters.length > 0) {
                    sUrl = appModulePath + "/service/activitytrackerentity?$filter=" + aFilters;
                } else if (this.isAdmin && (aFilters.length === 0)) {
                    sUrl = appModulePath + "/service/activitytrackerentity"
                } else {
                    aFilters = aFilters + " and EmailId eq '" + EmailId + "'";
                    sUrl = appModulePath + "/service/activitytrackerentity?$filter=" + aFilters;
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
                        let CreatedByUsers = [];
                        if (that.isAdmin) {
                            $.ajax({
                                type: "GET", url: appModulePath + "/service/activitytrackerentity", success: function (result1, xhr1, data1) {
                                    result1.value.forEach(function (item) {
                                        if (item.CreatedByUser) {
                                            CreatedByUsers.push({ code: item.CreatedByUser, desc: item.CreatedByUser })
                                        }
                                    })
                                    const key = 'code';
                                    const uniqueUsers = [...new Map(CreatedByUsers.map(item => [item[key], item])).values()];
                                    if (uniqueUsers.length > 1) {
                                        uniqueUsers.unshift({ code: "", desc: "(Select)" });
                                    }
                                    that.getView().getModel("LocalModel").setProperty("/CreatedByUsers", uniqueUsers)
                                }
                            });
                        } else {
                            CreatedByUsers.push({ code: EmailId, desc: EmailId });
                            that.getView().getModel("LocalModel").setProperty("/CreatedByUsers", CreatedByUsers)
                        }
                        Data.forEach(function (item) {
                            item.CreatedByUser = item.CreatedByUser === null ? "" : item.CreatedByUser;
                            item.EntryDate = item.EntryDate === null ? null : new Date(item.EntryDate);
                            item.ActivityDate = item.ActivityDate === null ? null : new Date(item.ActivityDate);
                        });
                        var oModel = new sap.ui.model.json.JSONModel();
                        oModel.setData(Data);
                        that.getView().setModel(oModel);

                        let CountUrl = "";
                        if (!that.isAdmin && (aFilters.length === 0)) {
                            CountUrl = "?$filter=EmailId eq '" + EmailId + "'";
                            $.ajax({
                                type: "GET", url: appModulePath + "/service/activitytrackerentity/$count" + CountUrl, success: function (result1, xhr1, headers1) {
                                    that.getView().getModel("LocalModel").setProperty("/requestsCount", parseInt(result1));
                                }
                            });
                        } else if (that.isAdmin && (aFilters.length === 0)) {
                            CountUrl = "";
                            $.ajax({
                                type: "GET", url: appModulePath + "/service/activitytrackerentity/$count" + CountUrl, success: function (result1, xhr1, headers1) {
                                    that.getView().getModel("LocalModel").setProperty("/requestsCount", parseInt(result1));
                                }
                            });
                        } else if (that.isAdmin && aFilters.length > 0) {
                            CountUrl = "?$filter=" + aFilters;
                            $.ajax({
                                type: "GET", url: appModulePath + "/service/activitytrackerentity/$count" + CountUrl, success: function (result1, xhr1, headers1) {
                                    that.getView().getModel("LocalModel").setProperty("/requestsCount", parseInt(result1));
                                }
                            });
                        } else {
                            // aFilters = aFilters + ",EmailId eq '" + EmailId + "'";
                            CountUrl = "?$filter=" + aFilters;
                            $.ajax({
                                type: "GET", url: appModulePath + "/service/activitytrackerentity/$count" + CountUrl, success: function (result1, xhr1, headers1) {
                                    that.getView().getModel("LocalModel").setProperty("/requestsCount", parseInt(result1));
                                }
                            });
                        }
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (request, status, error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Technical error please contact system administrator");
                    }
                });
            },
            // dateFormatter: function (dValue) {
            //     if (dValue) {
            //         const date1 = dValue.getUTCDate() > 9 ? "" + dValue.getUTCDate() : "0" + dValue.getUTCDate();
            //         const month1 = (dValue.getUTCMonth() + 1) > 9 ? "" + (dValue.getUTCMonth() + 1) : "0" + (dValue.getUTCMonth() + 1);
            //         const year = dValue.getUTCFullYear()
            //         const dateStr = date1 + "/" + month1 + "/" + year;
            //         return dateStr;
            //     }
            //     else {
            //         return null;
            //     }
            // },
            onClear: function (oEvent) {
                this.getView().byId("idfName").setSelectedKey("");
                this.getView().byId("fActivityDate").setValue("");
                this.getView().byId("fActivityType").setSelectedKey("");
                this.getView().byId("fTypeofWork").setValue("");
                this.getView().byId("fActivityCode").setSelectedKey("");
                // this.getView().byId("fCustomer").setSelectedKey("");
                this.getView().byId("fCustomer").setValue("");
                if (oEvent) {
                    this.getTrackersData([]);
                }
            },
            onSearch: function (oEvent) {
                var Name = this.getView().byId("idfName").getSelectedKey();
                var ActivityDate = this.getView().byId("fActivityDate").getValue();
                var ActivityType = this.getView().byId("fActivityType").getSelectedKey();
                // var Customer = this.getView().byId("fCustomer").getSelectedKey();
                var Customer = this.getView().byId("fCustomer").getValue();
                var TypeofWork = this.getView().byId("fTypeofWork").getValue();
                var ActivityCode = this.getView().byId("fActivityCode").getSelectedKey();
                var comFil = "";
                if (Name && Name !== "(Select)") {
                    comFil = comFil === "" ? "CreatedByUser eq '" + Name + "'" : comFil + " and CreatedByUser eq " + Name + "'";
                }
                if (ActivityDate) {
                    ActivityDate = this.uploadDateFormatter(ActivityDate);
                    ActivityDate = new Date(ActivityDate)
                    var userTimezoneOffset = ActivityDate.getTimezoneOffset() * 60000;
                    ActivityDate = new Date(ActivityDate.getTime() - userTimezoneOffset).toISOString();
                    comFil = comFil === "" ? "ActivityDate ge " + ActivityDate.split("T")[0] + "T00:00:00Z and ActivityDate le " + ActivityDate.split("T")[0] + "T23:59:59Z" : comFil + " and ActivityDate ge " + ActivityDate.split("T")[0] + "T00:00:00Z and ActivityDate le " + ActivityDate.split("T")[0] + "T23:59:59Z";
                }
                if (Customer && Customer !== "(Select)") {
                    comFil = comFil === "" ? "Customer eq '" + Customer + "'" : comFil + " and Customer eq '" + Customer + "'";
                }
                if (ActivityType && ActivityType !== "(Select)") {
                    comFil = comFil === "" ? "ActivityType eq '" + ActivityType + "'" : comFil + " and ActivityType eq '" + ActivityType + "'";
                }
                if (TypeofWork && TypeofWork !== "(Select)") {
                    comFil = comFil === "" ? "TypeOfWork eq '" + TypeofWork + "'" : comFil + " and TypeOfWork eq '" + TypeofWork + "'";
                }
                if (ActivityCode && ActivityCode !== "(Select)") {
                    comFil = comFil === "" ? "ActivityCode eq '" + ActivityCode + "'" : comFil + " and ActivityCode eq '" + ActivityCode + "'";
                }
                sap.ui.core.BusyIndicator.show(0);
                this.getTrackersData(comFil);
            },
            onAdd: function (oEvent) {
                var icon = "sap-icon://add-activity"
                var Data = "";
                this.Flag = "Add";
                this.onAddorEdit("Add", icon, Data)
            },
            onEdit: function (oEvent) {
                var icon = "sap-icon://edit"
                var Data = oEvent.getSource().getBindingContext().getObject();
                this.Flag = "Edit";
                this.onAddorEdit("Edit", icon, Data)
            },
            onAddorEdit: function (flag, icon, aData) {
                var that = this;
                sap.ui.core.BusyIndicator.show(0);
                if (!this.Dialog) {
                    this.Dialog = new Dialog({
                        title: "Activity Tracker",
                        type: 'Message',
                        icon: icon,
                        titleAlignment: "Center",
                        content: sap.ui.xmlfragment("ns.activitytrackerapp.view.fragments.newRecord", this),
                        contentWidth: '33%',
                        contentHeight: '63%',
                        beginButton: new Button({
                            text: "Submit",
                            type: 'Accept',
                            press: function () {
                                var newData = that.Dialog.getModel("newActivity").getProperty("/");
                                newData.CreatedByUser = that.EmailId;
                                var MessageModel = that.validateDialogRecord(newData);
                                if (MessageModel.length === 0) {
                                    let Data = [];
                                    Data.push(newData);
                                    that.getToken(Data, that.Flag);
                                } else {
                                    var messages = MessageModel[0];
                                    MessageModel.forEach(function (value, index, items) {
                                        if (index !== 0) {
                                            messages = messages + "\n" + value;
                                        }
                                    })
                                    MessageBox.error(messages);
                                }
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            type: 'Reject',
                            press: function () {
                                this.Dialog.getModel("newActivity").setData({});
                                that.Dialog.close();
                            }.bind(this)
                        })
                    });
                    this.Dialog.addStyleClass("sapUiSizeCompact");
                }
                let dDate = new Date();
                var MasterData = this.getView().getModel("MasterData").getProperty("/");
                var customerModel = new JSONModel();
                customerModel.setSizeLimit(100000);
                if (flag === "Edit") {
                    aData.Names = MasterData.Names;
                    aData.ActivityTypes = MasterData.ActivityTypes;
                    aData.Customers = MasterData.Customers;
                    aData.ActivityCodes = MasterData.ActivityCodes;
                    aData.TypeOfWorks = MasterData.TypeOfWorks;
                    customerModel.setData(aData);
                } else {
                    customerModel.setData({ COEMember: "", ActivityID: "", ActivityDate: dDate, EntryDate: dDate, Name: MasterData.Names[0].desc, Names: MasterData.Names, ActivityType: "", ActivityTypes: MasterData.ActivityTypes, Customer: "", Customers: MasterData.Customers, TypeOfWork: "", TypeOfWorks: MasterData.TypeOfWorks, ActivityCode: "", ActivityCodes: MasterData.ActivityCodes, Comments: "" });
                }

                customerModel.setSizeLimit(100000);
                this.Dialog.setModel(customerModel, "newActivity");
                sap.ui.core.BusyIndicator.hide();
                this.Dialog.open();
                // sap.ui.getCore().byId("frCustomer").setFilterFunction(function (sTerm, oItem) {
                //     return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
                // });
            },

            onActivityDateChange: function (oEvent) {
                let value = oEvent.getParameter("value");
                oEvent.getSource().getModel("newActivity").setProperty("/", new Date(value))
            },
            onAddMasterData: function (oEvent) {
                var that = this;
                sap.ui.core.BusyIndicator.show(0);
                if (!this.MasterDialog) {
                    this.MasterDialog = new Dialog({
                        title: "Master Data",
                        type: 'Message',
                        icon: 'sap-icon://add-document',
                        titleAlignment: "Center",
                        content: sap.ui.xmlfragment("ns.activitytrackerapp.view.fragments.addMasterData", this),
                        contentWidth: '33%',
                        contentHeight: '32%',
                        beginButton: new Button({
                            text: "Submit",
                            type: 'Accept',
                            press: function () {
                                var newData = that.MasterDialog.getModel("MDataModel").getProperty("/");
                                var MessageModel = that.validateDialogMasterDataRecord(newData);
                                if (MessageModel.length === 0) {
                                    let Data = [];
                                    Data.push(newData);
                                    that.MasterID = "";
                                    that.configureUploadEntity(Data);
                                    // that.postMasterData(Data)
                                } else {
                                    var messages = MessageModel[0];
                                    MessageModel.forEach(function (value, index, items) {
                                        if (index !== 0) {
                                            messages = messages + "\n" + value;
                                        }
                                    })
                                    MessageBox.error(messages);
                                }
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            type: 'Reject',
                            press: function () {
                                this.MasterDialog.getModel("MDataModel").setData({});
                                that.MasterDialog.close();
                                sap.ui.core.BusyIndicator.hide();
                            }.bind(this)
                        })
                    });
                    this.MasterDialog.addStyleClass("sapUiSizeCompact");
                }
                let MasterData = this.getView().getModel("MasterData").getProperty("/");
                var customerModel = new JSONModel();
                customerModel.setData({ Code: "", Desc: "", type: "AT", Types: [{ type: "AT", desc: "Activity Type" }, { type: "CU", desc: "Customer" }, { type: "TW", desc: "Type of Work" }, { type: "AC", desc: "Activity Code" }] });
                this.MasterDialog.setModel(customerModel, "MDataModel");
                var MDmodel = new JSONModel();
                MDmodel.setData(MasterData.MastersData);
                this.MasterDialog.setModel(MDmodel, "MDModel");
                sap.ui.core.BusyIndicator.hide();
                this.MasterDialog.open();

            },
            validateDialogMasterDataRecord: function (newData) {
                let MasterData = this.getView().getModel("MasterData").getProperty("/");
                var MessageModel = [];
                if (!newData.Desc) {
                    MessageModel.push("Please enter Data.");
                }
                var Type = newData.type;
                let SelectedDataList = [];
                if (Type === "CU") {
                    SelectedDataList = MasterData.Customers;
                } else if (Type === "AT") {
                    SelectedDataList = MasterData.ActivityTypes;
                } else if (Type === "TW") {
                    SelectedDataList = MasterData.TypeOfWorks;
                } else if (Type === "AC") {
                    SelectedDataList = MasterData.ActivityCodes;
                }
                SelectedDataList.forEach(function (item) {
                    if (item.desc === newData.Desc) {
                        MessageModel.push("Entered Data already exist.");
                    }
                })
                return MessageModel;
            },
            validateDialogRecord: function (newData) {
                var MessageModel = [];
                if (!newData.Name) {
                    MessageModel.push("Please select Name.");
                }
                if (!newData.ActivityType) {
                    MessageModel.push("Please select Activity Type.");
                }
                if (!newData.Customer) {
                    MessageModel.push("Please select Customer.");
                }
                if (!newData.TypeOfWork) {
                    MessageModel.push("Please select Type of Work.");
                }
                if (!newData.ActivityCode) {
                    MessageModel.push("Please select Activity Code.");
                }

                return MessageModel;
            },
            getToken: function (dData, flag) {
                var that = this
                let appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath")
                let sURL = appModulePath + "/service/activitytrackerentity"
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
                        if (flag === "Edit") {
                            that.updateData(sURL, fetchedToken, dData);
                        } else {
                            that.postData(sURL, fetchedToken, dData);
                        }

                    },
                    error: function (result1, xhr1, headers1) {
                        // debugger;
                        that.Dialog.close();
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured, Please check chrome inspector tool for error details"
                        );

                    }
                });
            },
            postMasterData: function (dData) {
                sap.ui.core.BusyIndicator.show();
                var that = this
                let appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath")
                // let sURL = appModulePath + "/service/masterdatauploadentity(ID=" + that.MasterID + ")"
                // let MDlength = dData.length;
                let MDlength = 1;
                for (let i = 0; i < dData.length; i++) {
                    delete dData[i].Types;
                    // dData[i].masterDataID_ID = that.MasterID
                }
                let MSData = {};
                MSData.masterData = dData;
                $.ajax({
                    url: appModulePath + "/service/masterdatauploadentity",
                    method: "POST",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(MSData),
                    success: function (result1, xhr1, headers1) {
                        MDlength--;
                        if (MDlength === 0) {
                            sap.ui.core.BusyIndicator.hide();
                            if (that.MasterDialog) {
                                that.MasterDialog.close();
                            }
                            MessageBox.success("Master Data entry saved successfully.");
                            that.getMasterData();
                        }
                    },
                    error: function (result1, xhr1, headers1) {
                        // debugger;

                        if (that.MasterDialog) {
                            that.MasterDialog.close();
                        }
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured, Please check chrome inspector tool for error details"
                        );

                    }
                });


            },
            updateData: function (sURL, fetchedToken, aData) {
                let that = this;
                delete aData[0].Names;
                delete aData[0].ActivityTypes;
                delete aData[0].Customers;
                delete aData[0].ActivityCodes;
                delete aData[0].TypeOfWorks;
                $.ajax({
                    url: sURL + "(ID=" + aData[0].ID + ")",
                    method: "PUT",
                    async: false,
                    headers: {
                        "X-CSRF-Token": fetchedToken,
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(aData[0]),
                    success: function (result1, xhr1, headers1) {

                        sap.ui.core.BusyIndicator.hide();
                        if (that.Dialog) {
                            that.Dialog.close();
                        }
                        MessageBox.success("Activity entry updated successfully.");
                        that.onClear();
                        that.getTrackersData([]);
                        that.getMasterData();
                    },
                    error: function (result1, xhr1, headers1) {
                        // debugger;
                        if (that.Dialog) {
                            that.Dialog.close();
                        }
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(
                            "Error occured, Please check chrome inspector tool for error details"
                        );
                    }
                });
            },
            postData: function (sURL, fetchedToken, dData) {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                let dataLength = dData.length;
                for (let i = 0; i < dData.length; i++) {
                    var aData = {};
                    aData.Name = this.FullName;
                    aData.EmailId = this.EmailId;
                    aData.ActivityDate = dData[i].ActivityDate;
                    aData.EntryDate = dData[i].EntryDate;
                    aData.ActivityID = (Math.floor(Math.random() * 90000) + 100000000).toString();
                    aData.COEMember = aData.COEMember ? aData.COEMember : "Team Member";
                    aData.ActivityType = dData[i].ActivityType;
                    aData.Customer = dData[i].Customer;
                    aData.TypeOfWork = dData[i].TypeOfWork;
                    aData.ActivityCode = dData[i].ActivityCode;
                    aData.CreatedByUser = dData[i].CreatedByUser ? dData[i].CreatedByUser : this.EmailId;
                    aData.Comments = dData[i].Comments;
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
                            dataLength--;
                            if (dataLength === 0) {
                                sap.ui.core.BusyIndicator.hide();

                                if (that.Dialog) {
                                    that.Dialog.close();
                                }
                                MessageBox.success("Activity entry(ies) recorded successfully.");
                                that.onClear();
                                that.getTrackersData([]);
                                that.getMasterData();
                            }

                            // that._fetchTokenPV(aData);
                        },
                        error: function (result1, xhr1, headers1) {
                            // debugger;
                            if (that.Dialog) {
                                that.Dialog.close();
                            }
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show(
                                "Error occured, Please check chrome inspector tool for error details"
                            );
                        }
                    });
                }

            },

            onUpload: function (oEvent) {
                var that = this;
                var fU = this.getView().byId("idfileUploader");
                let ModelData = this.getView().getModel().getData();
                var domRef = fU.getFocusDomRef();
                var file = oEvent.getParameter('files')[0];
                var filetype = file.name.split(".")[1];
                // Create a File Reader object
                var reader = new FileReader();
                var t = this;
                var data = [];
                reader.onload = function (e) {
                    if (filetype.toUpperCase() === "XLSX") {
                        var xlsxdata = e.target.result;
                        var workbook = XLSX.read(xlsxdata, {
                            type: 'binary'
                        });
                        workbook.SheetNames.forEach(function (sheetName) {
                            data = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        });
                    }
                    else if (filetype.toUpperCase() === "CSV") {
                        var strCSV = e.target.result;
                        var arrCSV = strCSV.match(/[\w . \- \@ \/: ]+(?=,?)/g);
                        var noOfCols = 10;
                        var hdrRow = arrCSV.splice(0, noOfCols);
                        while (arrCSV.length > 0) {
                            var obj = {};
                            // extract remaining rows one by one
                            var row = arrCSV.splice(0, noOfCols)
                            for (var i = 0; i < row.length; i++) {
                                obj[hdrRow[i]] = row[i].trim()
                            }
                            // push row to an array
                            data.push(obj)
                        }
                    }
                    let MasterData = that.getView().getModel("MasterData").getProperty("/");
                    var MessageModel = [];
                    let CUDataList = MasterData.Customers;
                    let ATDataList = MasterData.ActivityTypes;
                    let TWDataList = MasterData.TypeOfWorks;
                    let ACList = MasterData.ActivityCodes;
                    for (let i = 0; i < data.length; i++) {
                        let CUFound = false
                        let ATFound = false
                        let TWFound = false
                        let ACFound = false
                        let msg = "";

                        data[i].ActivityID = data[i]["Activity ID"] ? data[i]["Activity ID"] : "";
                        delete data[i]["CoE Member"];
                        data[i].ActivityDate = data[i]["Activity Date"] ? that.uploadDateFormatter(data[i]["Activity Date"]) : new Date();
                        delete data[i]["Activity Date"];
                        data[i].EntryDate = data[i]["Entry Date"] ? that.uploadDateFormatter(data[i]["Entry Date"]) : new Date();
                        delete data[i]["Entry Date"];
                        data[i].CreatedByUser = data[i]["Created By"];
                        delete data[i]["Created By"];
                        data[i].COEMember = data[i]["CoE Member"] ? data[i]["CoE Member"] : "Team Member";
                        delete data[i]["CoE Member"];
                        data[i].ActivityType = data[i]["Activity Type"];
                        delete data[i]["Activity Type"];
                        data[i].TypeOfWork = data[i]["Type Of Work"];
                        delete data[i]["Type Of Work"];
                        data[i].ActivityCode = data[i]["Activity Code"];
                        delete data[i]["Activity Code"];
                        if (data[i]["Comments "]) {
                            data[i].ActivityCode = data[i]["Comments "];
                            delete data[i]["Comments "];
                        }
                        for (let CU = 0; CU < CUDataList.length; CU++) {
                            if (CUDataList[CU].desc === data[i].Customer) {
                                CUFound = true
                                break;
                            }
                        }
                        if (!CUFound) {
                            msg = msg === "" ? "Customer" : msg + "Customer";
                        }
                        for (let AT = 0; AT < ATDataList.length; AT++) {
                            if (ATDataList[AT].desc === data[i].ActivityType) {
                                ATFound = true
                                break;
                            }
                        }
                        if (!ATFound) {
                            msg = msg === "" ? "Activity Type" : msg + ",Activity Type";

                        }
                        for (let TW = 0; TW < TWDataList.length; TW++) {
                            if (TWDataList[TW].desc === data[i].TypeOfWork) {
                                TWFound = true
                                break;
                            }
                        }
                        if (!TWFound) {
                            msg = msg === "" ? "Type Of Work" : msg + ",Type Of Work";
                        }
                        for (let AC = 0; AC < ACList.length; AC++) {
                            if (parseInt(ACList[AC].desc).toString() === parseInt(data[i].ActivityCode).toString()) {
                                ACFound = true
                                break;
                            }
                        }
                        if (!ACFound) {
                            msg = msg === "" ? "Activity Code" : msg + ",Activity Code";
                            // msg = msg + ",Activity Code";
                        }
                        let str = msg.includes(",") ? "are" : "is";
                        if (msg !== "") {
                            MessageModel.push(msg + " at row no " + (i + 1) + " " + str + " invalid.");
                        }
                    }
                    if (MessageModel.length === 0) {
                        that.getToken(data, "Add");
                        fU.clear();
                    } else {
                        reader = undefined;
                        fU.clear();
                        var messages = MessageModel[0];
                        MessageModel.forEach(function (value, index, items) {
                            if (index !== 0) {
                                messages = messages + "\n" + value;
                            }
                        })
                        MessageBox.error(messages);
                    }
                };
                reader.readAsBinaryString(file);
            },
            onUploadMasterData: function (oEvent) {
                var that = this;
                var fU = sap.ui.getCore().byId("idMasterfileUploader");
                var domRef = fU.getFocusDomRef();
                var file = oEvent.getParameter('files')[0];
                var filetype = file.name.split(".")[1];
                var reader = new FileReader();
                var t = this;
                var data = [];
                reader.onload = function (e) {
                    if (filetype.toUpperCase() === "XLSX") {
                        var xlsxdata = e.target.result;
                        var workbook = XLSX.read(xlsxdata, {
                            type: 'binary'
                        });
                        workbook.SheetNames.forEach(function (sheetName) {
                            data = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        });
                        let MasterData = that.getView().getModel("MasterData").getProperty("/");
                        var MessageModel = [];
                        let CUDataList = MasterData.Customers;
                        let ATDataList = MasterData.ActivityTypes;
                        let TWDataList = MasterData.TypeOfWorks;
                        let ACList = MasterData.ActivityCodes;
                        for (let i = 0; i < data.length; i++) {
                            let CUFound = false
                            let ATFound = false
                            let TWFound = false
                            let ACFound = false
                            let msg = "";
                            data[i].type = data[i]["Master Data Type"] === "Customer" ? "CU" : data[i]["Master Data Type"] === "Activity Type" ? "AT" : data[i]["Master Data Type"] === "Type Of Work" ? "TW" : data[i]["Master Data Type"] === "Activity Code" ? "AC" : "";
                            delete data[i]["Master Data Type"];
                            data[i].Desc = data[i]["Description"] ? data[i]["Description"] : "";
                            // data[i].Desc = data[i].type === "AC" ? data[i].Desc : data[i].Desc
                            delete data[i]["Description"];
                            for (let CU = 0; CU < CUDataList.length; CU++) {
                                if (CUDataList[CU].desc === data[i].Desc && CUDataList[CU].type === data[i].type) {
                                    CUFound = true
                                    break;
                                }
                            }
                            if (CUFound) {
                                msg = msg === "" ? "Customer" : msg + "Customer";
                            }
                            for (let AT = 0; AT < ATDataList.length; AT++) {
                                if (ATDataList[AT].desc === data[i].Desc && ATDataList[AT].type === data[i].type) {
                                    ATFound = true
                                    break;
                                }
                            }
                            if (ATFound) {
                                msg = msg === "" ? "Activity Type" : msg + ",Activity Type";

                            }
                            for (let TW = 0; TW < TWDataList.length; TW++) {
                                if (TWDataList[TW].desc === data[i].Desc && TWDataList[TW].type === data[i].type) {
                                    TWFound = true
                                    break;
                                }
                            }
                            if (TWFound) {
                                msg = msg === "" ? "Type Of Work" : msg + ",Type Of Work";
                            }
                            for (let AC = 0; AC < ACList.length; AC++) {

                                if (ACList[AC].desc === data[i].Desc && ACList[AC].type === data[i].type) {
                                    ACFound = true
                                    break;
                                }
                            }
                            if (ACFound) {
                                msg = msg === "" ? "Activity Code" : msg + ",Activity Code";
                                // msg = msg + ",Activity Code";
                            }
                            let str = msg.includes(",") ? "are" : "is";
                            if (msg !== "") {
                                MessageModel.push(msg + " at row no " + (i + 2) + " " + str + " already available in Database.");
                            }
                        }
                        if (MessageModel.length === 0) {
                            that.MasterID = "";
                            that.configureUploadEntity(data);

                            fU.clear();
                        } else {
                            reader = undefined;
                            fU.clear();
                            var messages = MessageModel[0];
                            MessageModel.forEach(function (value, index, items) {
                                if (index !== 0) {
                                    messages = messages + "\n" + value;
                                }
                            })
                            MessageBox.error(messages);
                        }


                    } else {
                        MessageBox.error("Invalid File format.")
                    }

                };
                reader.readAsBinaryString(file);
            },

            uploadDateFormatter: function (dValue) {
                if (dValue) {
                    let splittedValue = dValue.split("/");
                    dValue = splittedValue[1] + "/" + splittedValue[0] + "/" + splittedValue[2]
                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                        pattern: "yyyy-MM-dd"
                    });
                    dValue = dateFormat.format(new Date(dValue));
                    dValue = dValue + "T00:00:00Z";
                }
                return dValue
            },
            onDelete: function (oEvent) {
                var that = this;
                var appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath");
                var ID = oEvent.getSource().getBindingContext().getObject().ID;
                var sURL = appModulePath + "/service/activitytrackerentity(ID=" + ID + ")"
                $.ajax({
                    url: sURL,
                    method: "DELETE",
                    async: true,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result1, xhr1, headers1) {
                        MessageToast.show("Activity Entry deleted successfully");
                        that.onClear();
                        that.getTrackersData([]);
                        that.getMasterData();

                    },
                    error: function (result1, xhr1, headers1) {
                        MessageToast.show(
                            "Error occured while updating the Status, Please check chrome inspector tool for error details"
                        );
                    }
                });
            },
            onExport: function (oEvent) {
                var that = this;
                var oItem = oEvent.getParameter("item");
                var selectedFormat = oItem.getText();
                let exportType = "";
                if (selectedFormat === "CSV Format") {
                    exportType = new ExportTypeCSV({
                        charset: "utf-8",
                        fileExtension: "csv",
                        separatorChar: ";",
                        mimeType: "application/csv"
                    })

                    var oExport = new Export({
                        exportType: exportType,
                        models: that.getView().getModel(),
                        rows: {
                            path: "/"
                        },
                        columns: [
                            {
                                name: "Activity ID",
                                template: {
                                    content: "{ActivityID}"
                                }
                            }, {
                                name: "CoE Member",
                                template: {
                                    content: "{COEMember}"
                                }
                            }, {
                                name: "Entry Date",
                                template: {
                                    content: {
                                        parts: ["EntryDate"],
                                        formatter: function (dValue) {
                                            if (dValue) {
                                                const date1 = dValue.getUTCDate() > 9 ? "" + dValue.getUTCDate() : "0" + dValue.getUTCDate();
                                                const month1 = (dValue.getUTCMonth() + 1) > 9 ? "" + (dValue.getUTCMonth() + 1) : "0" + (dValue.getUTCMonth() + 1);
                                                const year = dValue.getUTCFullYear()
                                                const dateStr = date1 + "/" + month1 + "/" + year;
                                                return dateStr;
                                            }
                                            else {
                                                return null;
                                            }
                                        }
                                    }
                                }
                            }, {
                                name: "Activity Date",
                                template: {
                                    content: {
                                        parts: ["ActivityDate"],
                                        formatter: function (dValue) {
                                            if (dValue) {
                                                const date1 = dValue.getUTCDate() > 9 ? "" + dValue.getUTCDate() : "0" + dValue.getUTCDate();
                                                const month1 = (dValue.getUTCMonth() + 1) > 9 ? "" + (dValue.getUTCMonth() + 1) : "0" + (dValue.getUTCMonth() + 1);
                                                const year = dValue.getUTCFullYear()
                                                const dateStr = date1 + "/" + month1 + "/" + year;
                                                return dateStr;
                                            }
                                            else {
                                                return null;
                                            }
                                        }
                                    }
                                }

                            }, {
                                name: "Activity Type",
                                template: {
                                    content: "{ActivityType}"
                                }
                            }, {
                                name: "Customer",
                                template: {
                                    content: "{Customer}"
                                }
                            }, {
                                name: "Type Of Work",
                                template: {
                                    content: "{TypeOfWork}"
                                }
                            }, {
                                name: "Activity Code",
                                template: {
                                    content: "{ActivityCode}"
                                }
                            }, {
                                name: "Created By",
                                template: {
                                    content: "{CreatedByUser}"
                                }
                            }, {
                                name: "Comments",
                                template: {
                                    content: "{Comments}"
                                }
                            }]
                    });

                    // download exported file
                    oExport.saveFile("ActivityTracker").catch(function (oError) {
                        MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
                    }).then(function () {
                        oExport.destroy();
                    });
                } else if (selectedFormat === "XLSX Format") {
                    that.onExportXSLX();
                }
            },

            onExportMasterData: function (oEvent) {
                var that = this;
                var aCols, oRowBinding, oSettings, oSheet, oTable;

                if (!this._oTable) {
                    this._oTable = sap.ui.getCore().byId('idMasterTable');
                }

                oTable = this._oTable;
                oRowBinding = oTable.getBinding('items');
                aCols = [];
                aCols.push({
                    label: "Master Data Type",
                    property: 'typedesc',
                    type: EdmType.String
                });
                // aCols.push({
                //     label: "Code",
                //     property: 'Code',
                //     type: EdmType.String
                // });
                aCols.push({
                    label: "Description",
                    property: 'Desc',
                    type: EdmType.String
                });
                oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: oRowBinding,
                    fileName: 'MasterData.xlsx',
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {

                    })
                    .finally(function () {
                        oSheet.destroy();
                    });

            },

            createColumnConfig: function () {
                var aCols = [];

                aCols.push({
                    label: "Activity ID",
                    property: 'ActivityID',
                    type: EdmType.String
                });
                aCols.push({
                    label: "CoE Member",
                    property: 'COEMember',
                    type: EdmType.String
                });
                aCols.push({
                    label: "Entry Date",
                    type: EdmType.Date,
                    property: 'EntryDate',
                    format: 'dd/mm/yyyy',
                    textAlign: 'end'
                });
                aCols.push({
                    label: "Activity Date",
                    type: EdmType.Date,
                    property: 'ActivityDate',
                    format: 'dd/mm/yyyy',
                    textAlign: 'end'
                });
                aCols.push({
                    label: "Activity Type",
                    property: 'ActivityType',
                    type: EdmType.String
                });

                aCols.push({
                    label: "Customer",
                    property: 'Customer',
                    type: EdmType.String
                });
                aCols.push({
                    label: "Type Of Work",
                    property: 'TypeOfWork',
                    type: EdmType.String
                });
                aCols.push({
                    label: "Activity Code",
                    property: 'ActivityCode',
                    type: EdmType.String
                });
                aCols.push({
                    label: "Created By",
                    property: 'CreatedByUser',
                    type: EdmType.String
                });
                aCols.push({
                    label: "Comments",
                    property: 'Comments',
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
                    fileName: 'ActivityTracker.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        // MessageBox.success("Data exported succesfully.")
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            onDeleteAll: function () {
                var that = this;
                sap.ui.core.BusyIndicator.show();
                var appModulePath = this.getView().getModel("LocalModel").getProperty("/appModulePath");
                $.ajax({
                    url: appModulePath + "/service/masterdatauploadentity",
                    method: "GET",
                    async: false,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                        var Data = result.value;
                        var it = Data.length;
                        if (Data.length > 0) {
                            Data.forEach(VacData => {
                                $.ajax({
                                    url: appModulePath + "/service/masterdatauploadentity(ID=" + VacData.ID + ")",
                                    method: "DELETE",
                                    async: false,
                                    headers: {
                                        'Accept': 'application/json',
                                        "Content-Type": "application/json"
                                    },
                                    success: function (result, xhr, data) {
                                        it--
                                        if (it === 0) {
                                            sap.ui.core.BusyIndicator.hide();
                                            that.getMasterData();
                                        }
                                    }
                                });
                            });
                        } else {
                            sap.ui.core.BusyIndicator.hide();
                        }

                    },
                    error: function (request, status, error) {
                        that.page.setBusy(false);
                    }
                });

            },


            onExit: function () {
                if (this.Dialog) {
                    this.Dialog.destroy(true);
                }
                if (this.MasterDialog) {
                    this.MasterDialog.destroy(true);
                }

            }
        });
    });
