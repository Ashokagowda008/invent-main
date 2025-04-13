sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, MessageBox, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("cit.ux.yokogawadata.controller.Data", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);
            },

            onSelectSensors: function(oEvent) {
                var oControl = oEvent.getSource(),
                    bHasValue = false;
    
                if (oControl.getSelectedKey().length > 0) {
                    bHasValue = true;
                }
                oControl.data("hasValue", bHasValue);
                this.getView().byId("SensorDataTable").rebindTable();
            },

            onBeforeRebindTable: function(oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams");
                if(this.getView().byId("sensors").getSelectedKey().length){
                    mBindingParams.filters.push(
                        new Filter(
                            "sensor_id",
                            FilterOperator.EQ,
                            this.getView().byId("sensors").getSelectedKey()
                        )
                    );
                    if(mBindingParams.filters[0].aFilters){
                        var sDate1 = mBindingParams.filters[0].aFilters[0].oValue1;
                        var sDate2 = mBindingParams.filters[0].aFilters[0].oValue2;
                        var sValue1 = new Date(Date.UTC(sDate1.getFullYear(), sDate1.getMonth(), sDate1.getDate()));
                        var sValue2 = new Date(Date.UTC(sDate2.getFullYear(), sDate2.getMonth(), sDate2.getDate(), sDate2.getHours(), sDate2.getMinutes(), sDate2.getSeconds()));
                        mBindingParams.filters[0].aFilters[0].oValue1 = sValue1;
                        mBindingParams.filters[0].aFilters[0].oValue2 = sValue2;
                    }
                    this.getView().byId("SensorDataTable").setEntitySet("Sensor_Data_Entity");
                    mBindingParams.parameters["expand"] = "sensor/type";
                }
            },

            onDataPrevExpand: function(oEvent){
                if (oEvent.getSource().getExpanded() === true) {
                    this.getView().byId("SensorDataTable").rebindTable();
                }
            },

            onTypeMismatch: function (oEvent) {
                var sSupportedFileTypes = oEvent
                    .getSource()
                    .getFileType()
                    .map(function (sFileType) {
                        return "*." + sFileType;
                    })
                    .join(", ");

                showError(
                    "The file type *." +
                    oEvent.getParameter("fileType") +
                    " is not supported. Choose one of the following types: " +
                    sSupportedFileTypes
                );
            },
            _getDocServiceRuntimeBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath ;
            },

            onFileChange: function (oEvent) {
                var oUploadSet = this.byId("__fileUploader");
                var domRef = oUploadSet.getFocusDomRef();
                var file = oEvent.getParameter('files')[0];
                var filetype = file.name.split(".")[1];
                // Create a File Reader object
                var reader = new FileReader();
                var t = this;
                var data = [];
                reader.onload =async function (ev) {
                    // get an access to the content of the file
                    var Data = [];
                    this.content = ev.currentTarget.result.split(',')[1];
                    this.createfile(filetype, this.content);
                }.bind(this);
                reader.readAsDataURL(file);
            //    reader.readAsBinaryString(file);
           },
            createfile: function (filetype, base64) {
                // var filetype = this.byId("__fileUploader").getFileType();
                var that = this;
                var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
                var filebaes64 = this.content;
                $.ajax({
                    url: docuServiceBaseUrl + "/odata/v2/Sustainability/uploadExcel",
                    method: "POST",
                    async: false,
                    timeout: 300000,
                    data: JSON.stringify({ ExcelFile : filebaes64,fileType : filetype}),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                        MessageBox.success(result.d.uploadExcel);
                        that.byId("__fileUploader").clear();
                    },
                    error: function(oError){
                        MessageBox.error("An error occurred. Please try again with properly formatted data.");
                        that.byId("__fileUploader").clear();
                    }
                });
            }

        });
    });
