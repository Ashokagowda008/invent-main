sap.ui.define([
    "sap/ui/core/mvc/Controller",
     "sap/ui/model/json/JSONModel"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (Controller,JSONModel) {
        "use strict";

        return Controller.extend("bidcomparision.controller.View1", {
            onInit: function () {
                
                var url = this._getRuntimeBaseURL() + "/ariba_token/v2/oauth/token?grant_type=openapi_2lo";

                $.ajax({
                    url: url,
                    method: "POST",
                    contentType: "application/json",
                    async: true,
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                    },
                    error: function (error, jQXHR) {
                        console.log(error);
                    }
                });

            },

            _getRuntimeBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);

                return appModulePath;
            },

            onAfterRendering: function (oEvent) {
                var localModel = this._oComponent.getModel("localModel");
                this.getView().setModel(localModel, "localModel");
                
                // console.log(localModel.getData());
            },
        });
    });
