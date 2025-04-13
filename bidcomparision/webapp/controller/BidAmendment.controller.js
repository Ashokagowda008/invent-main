sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (Controller,JSONModel) {
        "use strict";

        return Controller.extend("bidcomparision.controller.BidAmendment", {
            onInit: function () {
                this._oView = this.getView();
                this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
            },
            onAfterRendering: function () {
                var AmendmentsDataModel = new JSONModel(this._oComponent.getModel("AmendmentsData").getData().Amendments);;
			    this.getView().setModel(AmendmentsDataModel, "AmendmentsData");
            },
        });
    });
