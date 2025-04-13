sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Text",
	"sap/m/Button",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Sorter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, JSONModel, Fragment, Dialog, Text, Button, ODataModel, Sorter) {
        "use strict";
        var _aValidTabKeys = ["plant", "sensor", "fuel", "SensorTypesData", "EquipmentTypesData"];
        return Controller.extend("cit.ux.yokogawa.controller.FuelConsumption", {
            onInit: function () {
                this.oBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
                this.getOwnerComponent().getRouter().getRoute("MasterData").attachPatternMatched(this._handleRouteMatched, this);
            },

            _handleRouteMatched: function(oEvent){
                if(oEvent.getParameter("arguments").tab){
                    switch(true) {
                        case oEvent.getParameter("arguments").tab.startsWith("plant"):
                            this.getView().byId("iconTabBarID").setSelectedKey("plant");
                            this.getView().byId("PlantSmartTable").attachBeforeRebindTable(oEvent.getParameter("arguments").tab, this.addPlantParams, this);
                            break;
                        case oEvent.getParameter("arguments").tab.startsWith("sensor"):
                            this.getView().byId("iconTabBarID").setSelectedKey("sensor");
                            this.getView().byId("MeterSmartTable").attachBeforeRebindTable(oEvent.getParameter("arguments").tab, this.addSensorParams, this);
                            break;
                        default:
                            // MessageToast.show("Something went wrong!");
                            return;
                    }
                }
            },

            addSensorParams: function(oEvent, oData){
                var match = oData.match(/'[^']+'/);
                if (match) {
                    this.getView().byId("smartFilterBar").getBasicSearchControl().setValue(match[0].slice(1, -1));
                    oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter('id', 'EQ', match[0].slice(1, -1)))
                    this.getView().byId("MeterSmartTable").detachBeforeRebindTable(this.addSensorParams, this);
                } else {
                    return null;
                }
            },

            addPlantParams: function(oEvent, oData){
                var match = oData.match(/'[^']+'/);
                if (match) {
                    this.getView().byId("smartPlantFilterBar").getBasicSearchControl().setValue(match[0].slice(1, -1));
                    oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter('id', 'EQ', match[0].slice(1, -1)))
                    this.getView().byId("PlantSmartTable").detachBeforeRebindTable(this.addPlantParams, this);
                } else {
                    return null;
                }
            },

            onTabChange: function(oEvent){
                var sSelectedTabKey = oEvent.getParameters().selectedKey;
                if(sSelectedTabKey && sSelectedTabKey == 'plant' || sSelectedTabKey == 'sensor'){
                    this.getOwnerComponent().getRouter().navTo("MasterData", {
                        tab: sSelectedTabKey
                    }, true);
                }else{
                    this.getOwnerComponent().getRouter().navTo("MasterData", {
                        tab: "others"
                }, true);
                }
            },

            onBeforeRebindSensorRegisterTable: function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.sorter.push(new Sorter("plant_id"));
                mBindingParams.parameters["expand"] = "equipment_type,type";
            },

            onAddEntry: function(sEntityDialog, sEntity){
                var bind = this._onCreateEntry(sEntity);
				var path = bind.getPath();
                var oView = this.getView();

                if (!this.byId(sEntityDialog)) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "cit.ux.yokogawa.view." + sEntityDialog,
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.bindElement({
                            path: path
                        });
                        oDialog.open();
                    });
                } else {
                    this.byId(sEntityDialog).bindElement({
                        path: path
                    });
                    this.byId(sEntityDialog).open();
                }
            },

            _onCreateEntry: function(sEntity){
                var properties;
                switch(sEntity) {
                    case "Plant_Info_Entity":
                        properties = {
                            "id": "000",
                            "desc": "",
                            "address": "",
                            "city": "",
                            "region": "",
                            "country": "",
                            "postcode": "",
                            "lattitude": "",
                            "longitude": ""
                        };
                        break;
                    case "Fuel_Category_Entity":
                        properties = {
                            "type": "000",
                            "desc": "",
                            "carbon_emission_value": 0,
                            "unit": "gram",
                            "is_renewable": false
                        };
                        break;
                    case "Sensor_Types_Entity":
                        properties = {
                            "id": "000",
                            "desc": "",
                            "unit": "",
                        };
                        break;
                    case "Equipment_type_Entity":
                        properties = {
                                "id": "000",
                                "desc": "",
                        };
                      break;
                    case "Sensor_Data_Entity":
                        properties = {
                                "timestamp": "",
                                "createdAt": "/Date(1703151595031+0000)/",
                                "createdBy": "",
                                "modifiedAt": "/Date(1703151595031+0000)/",
                                "modifiedBy": "",
                                "sensor_id": "",
                                "reading": ""
                        };
                        break;
                    case "Sensor_Register_Entity":
                        properties = {
                            "id": "000",
                            "equipment_no": "",
                            "equipment_type_id": "",
                            "type_id": "",
                            "plant_id": "",
                            "fuel_type": "",
                            "status": "",
                            "threshold_limit": null,
                            "lower_threshold_isactive": false,
                            "upper_threshold_isactive": false,
                            "lower_threshold_limit": null,
                            "upper_threshold_limit": null,
                            "create_maintainance_order": null
                        };
                        break;
                    default:
                        MessageToast.show("Something went wrong!");
                        return;
                  }
                  var bind = this.getView().getModel().createEntry("/" + sEntity, { properties: properties });
                  return bind;
            },

            onCancelDialogAdd: function (sEntityDialog) {
                this.getView().getModel().resetChanges();
                this.byId(sEntityDialog).close();
            },
            
            onEntryEdit: function(oEvent, sDialog){
                var oView = this.getView();
                if (!this.byId(sDialog)) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "cit.ux.yokogawa.view." + sDialog,
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.bindElement({
                            path: oEvent.getSource().getBindingContext().getPath()
                        });
                        oDialog.open();
                    });
                } else {
                    this.byId(sDialog).bindElement({
                        path: oEvent.getSource().getBindingContext().getPath()
                    });
                    this.byId(sDialog).open();
                }
                
            },

            onUpdateEntry: function(sEntityDialog){
                var that = this;
                this.getView().getModel().submitChanges({
                    success: function (oData) {
                        MessageToast.show(that.oBundle.getText("UpdateSuccess"));
                        that.getView().getModel().refresh();
                        that.getView().getModel().resetChanges();
                        that.byId(sEntityDialog).close();
                    },
                    error: function (error) {
                        MessageToast.show("Failed");
                    }
                });
            },

            onCancelDialogUpdate: function (sEntityDialog) {
                this.getView().getModel().resetChanges();
                this.byId(sEntityDialog).close();
            },

            onEntryDelete: function(oEvent){
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                this.sPath = oEvent.getSource().getBindingContext().getPath();
                var dialog = new Dialog({
                    title: that.getView().getModel("i18n").getResourceBundle().getText("Confirm"),
                    type: "Message",
                    content: new Text({
                        text: that.getView().getModel("i18n").getResourceBundle().getText("AreYouSureYouWantToDeleteThisRecord")
                    }),
                    beginButton: new Button({
                        text: that.getView().getModel("i18n").getResourceBundle().getText("Submit"),
                        press: function () {
                            oModel.remove(that.sPath, {
                                success: function () {
                                    MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText(
                                        "RecordDeletedSuccessfully"));
                                    that.getView().getModel().refresh();
                                },
                                error: function (error) {
                                    MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("DeleteFailed"));
                                }
                            });
                            dialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: that.getView().getModel("i18n").getResourceBundle().getText("Cancel"),
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function () {
                        dialog.destroy();
                    }
                });
                dialog.open();
            },

            onSelectLimit:function(oEvent, sField){
                if(!oEvent.getParameter('selected')){
                    this.getView().getModel().setProperty(oEvent.getSource().getBindingContext().getPath()+ '/' + sField, null);
                }
            }
        });
    });
